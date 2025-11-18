import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  inquiryCreateSchema,
  inquiryUpdateSchema,
  inquiryCommentSchema,
  capabilityResponseSchema,
  sectionAcceptanceSchema,
  commentReadStatusSchema,
} from "@app/schemas";
import { protectedProcedure, t } from "../middleware.ts";
import { insertNotification } from "../../_shared/notifications/utils.ts";

const router = t.router;

/**
 * Helper function to get user display name
 */
async function getUserDisplayName(
  supabase: any,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .schema("core")
    .from("users")
    .select("display_name, username")
    .eq("id", userId)
    .maybeSingle();

  if (!data) {
    return "User";
  }

  return data.display_name?.trim() || data.username?.trim() || "User";
}

/**
 * Helper function to get organization name from job
 */
async function getOrganizationName(
  supabase: any,
  jobId: string,
): Promise<string | null> {
  const { data: job } = await supabase
    .schema("core")
    .from("jobs")
    .select("organization_id, organizations(name)")
    .eq("id", jobId)
    .single();

  if (!job || !job.organizations) {
    return null;
  }

  return (job.organizations as { name: string | null })?.name || null;
}

/**
 * Helper function to check if user has access to an application
 * Returns the application data if access is granted
 */
async function verifyApplicationAccess(
  supabase: any,
  userId: string,
  applicationId: string,
  requireOrgAccess = false,
) {
  const { data: application, error } = await supabase
    .schema("core")
    .from("applications")
    .select(
      `
      id,
      user_id,
      job_id,
      job:jobs!job_id(
        id,
        organization_id,
        organization:organizations!organization_id(
          id,
          owner_user_id
        )
      )
    `,
    )
    .eq("id", applicationId)
    .single();

  if (error || !application) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Application not found",
    });
  }

  // Check if user is the applicant
  if (application.user_id === userId) {
    return application;
  }

  // Check if user has organization access
  const orgId = application.job?.organization_id;
  const ownerId = application.job?.organization?.owner_user_id;

  if (ownerId === userId) {
    return application;
  }

  // Check organization membership via role_assignments
  if (orgId) {
    const { data: roleAssignment } = await supabase
      .schema("core")
      .from("role_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("scope_org_id", orgId)
      .maybeSingle();

    if (roleAssignment) {
      return application;
    }
  }

  if (requireOrgAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this inquiry",
    });
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have access to this application",
  });
}

/**
 * Helper function to check if user is the applicant
 */
async function verifyIsApplicant(
  supabase: any,
  userId: string,
  applicationId: string,
) {
  const { data: application } = await supabase
    .schema("core")
    .from("applications")
    .select("user_id")
    .eq("id", applicationId)
    .single();

  if (!application || application.user_id !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the applicant can perform this action",
    });
  }
}

/**
 * Inquiries router - handles job inquiry and negotiation operations
 */
export const inquiriesRouter = router({
  /**
   * Create a new inquiry for an application
   * Organization members can create inquiries for applications to their jobs
   */
  create: protectedProcedure
    .input(inquiryCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Verify user has organization access to this application
      const application = await verifyApplicationAccess(
        supabase,
        user.id,
        input.applicationId,
        true,
      );

      // Check if inquiry already exists
      const { data: existingInquiry } = await supabase
        .schema("core")
        .from("application_inquiries")
        .select("id, status")
        .eq("application_id", input.applicationId)
        .single();

      if (existingInquiry && existingInquiry.status !== "withdrawn") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An active inquiry already exists for this application",
        });
      }

      // Prepare inquiry data (convert camelCase to snake_case)
      const inquiryData = {
        application_id: input.applicationId,
        created_by: user.id,
        status: "draft" as const,
        employment_type: input.employmentType ?? null,
        employment_type_negotiable: input.employmentTypeNegotiable,
        work_schedule: input.workSchedule ?? null,
        work_schedule_negotiable: input.workScheduleNegotiable,
        schedule_shifts: input.scheduleShifts,
        working_hours_start: input.workingHoursStart ?? null,
        working_hours_end: input.workingHoursEnd ?? null,
        working_hours_timezone: input.workingHoursTimezone ?? null,
        working_hours_negotiable: input.workingHoursNegotiable,
        workdays: input.workdays.length > 0 ? input.workdays : null,
        workdays_negotiable: input.workdaysNegotiable,
        employment_start_date: input.employmentStartDate,
        employment_end_date: input.employmentEndDate ?? null,
        employment_dates_negotiable: input.employmentDatesNegotiable,
        rate_type: input.rateType,
        rate_min_cents: input.rateMinCents,
        rate_max_cents: input.rateMaxCents ?? null,
        rate_negotiable: input.rateNegotiable,
        endurance_required: input.enduranceRequired,
        willing_to_travel: input.willingToTravel ?? null,
        travel_distance_miles: input.travelDistanceMiles ?? null,
        willing_to_work_overtime: input.willingToWorkOvertime ?? null,
        has_drivers_license: input.hasDriversLicense ?? null,
        additional_notes: input.additionalNotes ?? null,
      };

      // Create inquiry
      const { data: inquiry, error: inquiryError } = await supabase
        .schema("core")
        .from("application_inquiries")
        .insert(inquiryData)
        .select()
        .single();

      if (inquiryError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create inquiry: ${inquiryError.message}`,
          cause: inquiryError,
        });
      }

      // Initialize inquiry sections
      const sections = ["employment", "compensation", "capabilities", "other"];
      const sectionData = sections.map((sectionName) => ({
        inquiry_id: inquiry.id,
        section_name: sectionName,
      }));

      const { error: sectionsError } = await supabase
        .schema("core")
        .from("inquiry_sections")
        .insert(sectionData);

      if (sectionsError) {
        // Rollback inquiry creation
        await supabase
          .schema("core")
          .from("application_inquiries")
          .delete()
          .eq("id", inquiry.id);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create inquiry sections: ${sectionsError.message}`,
          cause: sectionsError,
        });
      }

      return inquiry;
    }),

  /**
   * Get inquiry by application ID
   * Returns inquiry with sections, comments, and responses
   */
  getByApplication: protectedProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Verify user has access to this application
      await verifyApplicationAccess(supabase, user.id, input.applicationId);

      // Get inquiry
      const { data: inquiry, error: inquiryError } = await supabase
        .schema("core")
        .from("application_inquiries")
        .select("*")
        .eq("application_id", input.applicationId)
        .single();

      if (inquiryError) {
        if (inquiryError.code === "PGRST116") {
          // Not found - return null
          return null;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch inquiry: ${inquiryError.message}`,
          cause: inquiryError,
        });
      }

      if (!inquiry) {
        return null;
      }

      // Get sections
      const { data: sections, error: sectionsError } = await supabase
        .schema("core")
        .from("inquiry_sections")
        .select("*")
        .eq("inquiry_id", inquiry.id)
        .order("section_name");

      if (sectionsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch sections: ${sectionsError.message}`,
          cause: sectionsError,
        });
      }

      // Get comments
      const { data: comments, error: commentsError } = await supabase
        .schema("core")
        .from("inquiry_comments")
        .select("*")
        .eq("inquiry_id", inquiry.id)
        .order("created_at", { ascending: true });

      if (commentsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch comments: ${commentsError.message}`,
          cause: commentsError,
        });
      }

      // Get capability responses
      const { data: capabilityResponses, error: responsesError } = await supabase
        .schema("core")
        .from("inquiry_capability_responses")
        .select("*")
        .eq("inquiry_id", inquiry.id);

      if (responsesError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch capability responses: ${responsesError.message}`,
          cause: responsesError,
        });
      }

      return {
        inquiry,
        sections: sections || [],
        comments: comments || [],
        capabilityResponses: capabilityResponses || [],
      };
    }),

  /**
   * Send inquiry (change status from draft to sent)
   * Updates application status to 'inquired'
   */
  send: protectedProcedure
    .input(z.object({ inquiryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Get inquiry to verify access
      const { data: inquiry, error: inquiryError } = await supabase
        .schema("core")
        .from("application_inquiries")
        .select("id, application_id, status, created_by")
        .eq("id", input.inquiryId)
        .single();

      if (inquiryError || !inquiry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inquiry not found",
        });
      }

      // Verify user created the inquiry or has org access
      if (inquiry.created_by !== user.id) {
        await verifyApplicationAccess(
          supabase,
          user.id,
          inquiry.application_id,
          true,
        );
      }

      if (inquiry.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft inquiries can be sent",
        });
      }

      const now = new Date().toISOString();

      // Update inquiry status and sent_at
      const { error: updateError } = await supabase
        .schema("core")
        .from("application_inquiries")
        .update({
          status: "sent",
          sent_at: now,
          updated_at: now,
        })
        .eq("id", input.inquiryId);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send inquiry: ${updateError.message}`,
          cause: updateError,
        });
      }

      // Update application status to 'inquired'
      const { error: appUpdateError } = await supabase
        .schema("core")
        .from("applications")
        .update({
          status: "inquired",
          stage_changed_at: now,
        })
        .eq("id", inquiry.application_id);

      if (appUpdateError) {
        // Log but don't fail - inquiry is already sent
        console.error("Failed to update application status:", appUpdateError);
      }

      // Get application and job info for notification
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id, job_id, jobs(title, organization_id, organizations(name))")
        .eq("id", inquiry.application_id)
        .single();

      if (application && application.user_id) {
        const job = application.jobs as any;
        const orgName = job?.organizations?.name || "Organization";
        const jobTitle = job?.title || "Job";

        // Notify candidate that inquiry has been sent
        await insertNotification(supabase, {
          user_id: application.user_id,
          type: "inquiry.sent",
          severity: "info",
          title: `Inquiry from ${orgName}`,
          message: `${orgName} has sent you an inquiry for ${jobTitle}`,
          cta_url: `/dashboard/applications/${inquiry.application_id}/inquiry`,
          metadata: {
            inquiry_id: inquiry.id,
            application_id: inquiry.application_id,
            job_id: application.job_id,
            organization_id: job?.organization_id,
          },
        });
      }

      return { success: true };
    }),

  /**
   * Add comment to an inquiry section
   * Updates inquiry status based on who is commenting
   */
  addComment: protectedProcedure
    .input(inquiryCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Get inquiry to verify access
      const { data: inquiry, error: inquiryError } = await supabase
        .schema("core")
        .from("application_inquiries")
        .select("id, application_id, status, created_by")
        .eq("id", input.inquiryId)
        .single();

      if (inquiryError || !inquiry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inquiry not found",
        });
      }

      // Verify user has access
      await verifyApplicationAccess(
        supabase,
        user.id,
        inquiry.application_id,
      );

      // Create comment
      const { data: comment, error: commentError } = await supabase
        .schema("core")
        .from("inquiry_comments")
        .insert({
          inquiry_id: input.inquiryId,
          section_name: input.sectionName,
          sender_id: user.id,
          content: input.content,
          read_by: [],
        })
        .select()
        .single();

      if (commentError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to add comment: ${commentError.message}`,
          cause: commentError,
        });
      }

      // Determine new status based on who is commenting
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id")
        .eq("id", inquiry.application_id)
        .single();

      let newStatus = inquiry.status;
      const isApplicant = application?.user_id === user.id;
      const isOrgMember = inquiry.created_by === user.id || !isApplicant;

      if (isApplicant && inquiry.status === "sent") {
        newStatus = "candidate_responded";
      } else if (isOrgMember && inquiry.status === "candidate_responded") {
        newStatus = "organization_responded";
      }

      // Update inquiry status if changed
      if (newStatus !== inquiry.status) {
        await supabase
          .schema("core")
          .from("application_inquiries")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.inquiryId);
      }

      // Get application info to determine recipient
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id, job_id, jobs(organization_id, organizations(name))")
        .eq("id", inquiry.application_id)
        .single();

      if (application) {
        const senderName = await getUserDisplayName(supabase, user.id);
        const sectionLabels: Record<string, string> = {
          employment: "Employment",
          compensation: "Compensation",
          capabilities: "Capabilities",
          other: "Other",
        };
        const sectionLabel = sectionLabels[input.sectionName] || input.sectionName;

        // Notify the other party
        if (isApplicant) {
          // Candidate commented, notify organization members
          const job = application.jobs as any;
          if (job?.organization_id) {
            // Get organization owner
            const { data: org } = await supabase
              .schema("core")
              .from("organizations")
              .select("owner_user_id")
              .eq("id", job.organization_id)
              .single();

            if (org?.owner_user_id) {
              await insertNotification(supabase, {
                user_id: org.owner_user_id,
                type: "inquiry.comment_added",
                severity: "info",
                title: `New Comment from ${senderName}`,
                message: `${senderName} commented on the ${sectionLabel} section`,
                cta_url: `/office/applications/${inquiry.application_id}/inquiry`,
                metadata: {
                  inquiry_id: inquiry.id,
                  application_id: inquiry.application_id,
                  section_name: input.sectionName,
                  comment_id: comment.id,
                },
              });
            }
          }
        } else {
          // Organization commented, notify candidate
          await insertNotification(supabase, {
            user_id: application.user_id,
            type: "inquiry.comment_added",
            severity: "info",
            title: `New Comment from ${senderName}`,
            message: `${senderName} commented on the ${sectionLabel} section`,
            cta_url: `/dashboard/applications/${inquiry.application_id}/inquiry`,
            metadata: {
              inquiry_id: inquiry.id,
              application_id: inquiry.application_id,
              section_name: input.sectionName,
              comment_id: comment.id,
            },
          });
        }
      }

      return comment;
    }),

  /**
   * Mark comment as read
   * Adds user to read_by array
   */
  markCommentRead: protectedProcedure
    .input(commentReadStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Get comment to verify access
      const { data: comment, error: commentError } = await supabase
        .schema("core")
        .from("inquiry_comments")
        .select("id, read_by, inquiry_id")
        .eq("id", input.commentId)
        .single();

      if (commentError || !comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Get inquiry to verify access
      const { data: inquiry } = await supabase
        .schema("core")
        .from("application_inquiries")
        .select("application_id")
        .eq("id", comment.inquiry_id)
        .single();

      if (inquiry) {
        await verifyApplicationAccess(
          supabase,
          user.id,
          inquiry.application_id,
        );
      }

      // Add user to read_by if not already present
      const readBy = (comment.read_by || []) as string[];
      if (!readBy.includes(user.id)) {
        readBy.push(user.id);

        const { error: updateError } = await supabase
          .schema("core")
          .from("inquiry_comments")
          .update({ read_by: readBy })
          .eq("id", input.commentId);

        if (updateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to mark comment as read: ${updateError.message}`,
            cause: updateError,
          });
        }
      }

      return { success: true };
    }),

  /**
   * Accept a section of the inquiry
   * Only applicant can accept sections
   */
  acceptSection: protectedProcedure
    .input(sectionAcceptanceSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Get inquiry to verify access
      const { data: inquiry, error: inquiryError } = await supabase
        .schema("core")
        .from("application_inquiries")
        .select("id, application_id, status")
        .eq("id", input.inquiryId)
        .single();

      if (inquiryError || !inquiry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inquiry not found",
        });
      }

      // Verify user is the applicant
      await verifyIsApplicant(supabase, user.id, inquiry.application_id);

      const now = new Date().toISOString();

      // Update section acceptance
      const { error: sectionError } = await supabase
        .schema("core")
        .from("inquiry_sections")
        .update({
          accepted_by: user.id,
          accepted_at: now,
        })
        .eq("inquiry_id", input.inquiryId)
        .eq("section_name", input.sectionName);

      if (sectionError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to accept section: ${sectionError.message}`,
          cause: sectionError,
        });
      }

      // Check if all sections are accepted
      const { data: sections } = await supabase
        .schema("core")
        .from("inquiry_sections")
        .select("accepted_by")
        .eq("inquiry_id", input.inquiryId);

      const allAccepted = sections?.every((s) => s.accepted_by !== null);

      // Update inquiry status if all sections accepted
      if (allAccepted && inquiry.status !== "accepted") {
        await supabase
          .schema("core")
          .from("application_inquiries")
          .update({
            status: "accepted",
            updated_at: now,
          })
          .eq("id", input.inquiryId);
      }

      // Get application and job info for notification
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id, job_id, jobs(organization_id, organizations(name))")
        .eq("id", inquiry.application_id)
        .single();

      if (application) {
        const candidateName = await getUserDisplayName(supabase, user.id);
        const sectionLabels: Record<string, string> = {
          employment: "Employment",
          compensation: "Compensation",
          capabilities: "Capabilities",
          other: "Other",
        };
        const sectionLabel = sectionLabels[input.sectionName] || input.sectionName;
        const job = application.jobs as any;

        if (allAccepted) {
          // All sections accepted - notify organization
          if (job?.organization_id) {
            const { data: org } = await supabase
              .schema("core")
              .from("organizations")
              .select("owner_user_id")
              .eq("id", job.organization_id)
              .single();

            if (org?.owner_user_id) {
              await insertNotification(supabase, {
                user_id: org.owner_user_id,
                type: "inquiry.fully_accepted",
                severity: "info",
                title: "All Terms Accepted",
                message: `${candidateName} has accepted all inquiry terms`,
                cta_url: `/office/applications/${inquiry.application_id}/inquiry`,
                metadata: {
                  inquiry_id: inquiry.id,
                  application_id: inquiry.application_id,
                },
              });
            }
          }
        } else {
          // Single section accepted - notify organization
          if (job?.organization_id) {
            const { data: org } = await supabase
              .schema("core")
              .from("organizations")
              .select("owner_user_id")
              .eq("id", job.organization_id)
              .single();

            if (org?.owner_user_id) {
              await insertNotification(supabase, {
                user_id: org.owner_user_id,
                type: "inquiry.section_accepted",
                severity: "info",
                title: "Section Accepted",
                message: `${candidateName} accepted the ${sectionLabel} terms`,
                cta_url: `/office/applications/${inquiry.application_id}/inquiry`,
                metadata: {
                  inquiry_id: inquiry.id,
                  application_id: inquiry.application_id,
                  section_name: input.sectionName,
                },
              });
            }
          }
        }
      }

      return { success: true, allAccepted: !!allAccepted };
    }),

  /**
   * Submit capability response
   * Only applicant can submit responses
   */
  submitCapabilityResponse: protectedProcedure
    .input(capabilityResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Get inquiry to verify access
      const { data: inquiry, error: inquiryError } = await supabase
        .schema("core")
        .from("application_inquiries")
        .select("id, application_id")
        .eq("id", input.inquiryId)
        .single();

      if (inquiryError || !inquiry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inquiry not found",
        });
      }

      // Verify user is the applicant
      await verifyIsApplicant(supabase, user.id, inquiry.application_id);

      const now = new Date().toISOString();

      // Upsert capability response
      const { data: response, error: responseError } = await supabase
        .schema("core")
        .from("inquiry_capability_responses")
        .upsert(
          {
            inquiry_id: input.inquiryId,
            capability_name: input.capabilityName,
            response_value: input.responseValue ?? null,
            response_text: input.responseText ?? null,
            updated_at: now,
          },
          {
            onConflict: "inquiry_id,capability_name",
          },
        )
        .select()
        .single();

      if (responseError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to submit response: ${responseError.message}`,
          cause: responseError,
        });
      }

      // Get application and job info for notification
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id, job_id, jobs(organization_id, organizations(name))")
        .eq("id", inquiry.application_id)
        .single();

      if (application) {
        const candidateName = await getUserDisplayName(supabase, user.id);
        const job = application.jobs as any;

        // Notify organization of capability response
        if (job?.organization_id) {
          const { data: org } = await supabase
            .schema("core")
            .from("organizations")
            .select("owner_user_id")
            .eq("id", job.organization_id)
            .single();

          if (org?.owner_user_id) {
            await insertNotification(supabase, {
              user_id: org.owner_user_id,
              type: "inquiry.capability_answered",
              severity: "info",
              title: "Capability Question Answered",
              message: `${candidateName} answered a capability question`,
              cta_url: `/office/applications/${inquiry.application_id}/inquiry`,
              metadata: {
                inquiry_id: inquiry.id,
                application_id: inquiry.application_id,
                capability_name: input.capabilityName,
              },
            });
          }
        }
      }

      return response;
    }),

  /**
   * Update inquiry
   * Only organization members can update inquiries
   */
  update: protectedProcedure
    .input(inquiryUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      const { id, ...updateData } = input;

      // Get inquiry to verify access
      const { data: inquiry, error: inquiryError } = await supabase
        .schema("core")
        .from("application_inquiries")
        .select("id, application_id, created_by, status")
        .eq("id", id)
        .single();

      if (inquiryError || !inquiry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inquiry not found",
        });
      }

      // Verify user created the inquiry or has org access
      if (inquiry.created_by !== user.id) {
        await verifyApplicationAccess(
          supabase,
          user.id,
          inquiry.application_id,
          true,
        );
      }

      // Convert camelCase to snake_case for update
      const snakeCaseData: Record<string, unknown> = {};

      if (updateData.employmentType !== undefined) {
        snakeCaseData.employment_type = updateData.employmentType;
      }
      if (updateData.employmentTypeNegotiable !== undefined) {
        snakeCaseData.employment_type_negotiable = updateData.employmentTypeNegotiable;
      }
      if (updateData.workSchedule !== undefined) {
        snakeCaseData.work_schedule = updateData.workSchedule;
      }
      if (updateData.workScheduleNegotiable !== undefined) {
        snakeCaseData.work_schedule_negotiable = updateData.workScheduleNegotiable;
      }
      if (updateData.scheduleShifts !== undefined) {
        snakeCaseData.schedule_shifts = updateData.scheduleShifts;
      }
      if (updateData.workingHoursStart !== undefined) {
        snakeCaseData.working_hours_start = updateData.workingHoursStart;
      }
      if (updateData.workingHoursEnd !== undefined) {
        snakeCaseData.working_hours_end = updateData.workingHoursEnd;
      }
      if (updateData.workingHoursTimezone !== undefined) {
        snakeCaseData.working_hours_timezone = updateData.workingHoursTimezone;
      }
      if (updateData.workingHoursNegotiable !== undefined) {
        snakeCaseData.working_hours_negotiable = updateData.workingHoursNegotiable;
      }
      if (updateData.workdays !== undefined) {
        snakeCaseData.workdays =
          updateData.workdays.length > 0 ? updateData.workdays : null;
      }
      if (updateData.workdaysNegotiable !== undefined) {
        snakeCaseData.workdays_negotiable = updateData.workdaysNegotiable;
      }
      if (updateData.employmentStartDate !== undefined) {
        snakeCaseData.employment_start_date = updateData.employmentStartDate;
      }
      if (updateData.employmentEndDate !== undefined) {
        snakeCaseData.employment_end_date = updateData.employmentEndDate ?? null;
      }
      if (updateData.employmentDatesNegotiable !== undefined) {
        snakeCaseData.employment_dates_negotiable =
          updateData.employmentDatesNegotiable;
      }
      if (updateData.rateType !== undefined) {
        snakeCaseData.rate_type = updateData.rateType;
      }
      if (updateData.rateMinCents !== undefined) {
        snakeCaseData.rate_min_cents = updateData.rateMinCents;
      }
      if (updateData.rateMaxCents !== undefined) {
        snakeCaseData.rate_max_cents = updateData.rateMaxCents ?? null;
      }
      if (updateData.rateNegotiable !== undefined) {
        snakeCaseData.rate_negotiable = updateData.rateNegotiable;
      }
      if (updateData.enduranceRequired !== undefined) {
        snakeCaseData.endurance_required = updateData.enduranceRequired;
      }
      if (updateData.willingToTravel !== undefined) {
        snakeCaseData.willing_to_travel = updateData.willingToTravel ?? null;
      }
      if (updateData.travelDistanceMiles !== undefined) {
        snakeCaseData.travel_distance_miles = updateData.travelDistanceMiles ?? null;
      }
      if (updateData.willingToWorkOvertime !== undefined) {
        snakeCaseData.willing_to_work_overtime = updateData.willingToWorkOvertime ?? null;
      }
      if (updateData.hasDriversLicense !== undefined) {
        snakeCaseData.has_drivers_license = updateData.hasDriversLicense ?? null;
      }
      if (updateData.additionalNotes !== undefined) {
        snakeCaseData.additional_notes = updateData.additionalNotes ?? null;
      }

      snakeCaseData.updated_at = new Date().toISOString();

      // Update inquiry
      const { data: updated, error: updateError } = await supabase
        .schema("core")
        .from("application_inquiries")
        .update(snakeCaseData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update inquiry: ${updateError.message}`,
          cause: updateError,
        });
      }

      return updated;
    }),
});

