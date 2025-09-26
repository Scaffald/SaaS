import {
  Avatar,
  Button,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  XStack,
  YStack,
} from '@app/ui'
import {
  Award,
  BadgeCheck,
  Briefcase,
  Clock4,
  Compass,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from '@tamagui/lucide-icons'

import {
  DashboardCard,
  SectionHeading,
} from '@app/core/features/home/components/dashboard/primitives'

type WorkExperience = {
  company: string
  role: string
  period: string
  highlights: string[]
}

type SimilarUser = {
  name: string
  role: string
  distance: string
  matchReason: string
  skills: string[]
  certifications: string[]
}

const profile = {
  name: 'Alicia Ramirez',
  headline: 'Senior Electrical Foreman',
  location: 'Houston, Texas',
  summary:
    'Licensed foreman with 12 years coordinating electrical crews across petrochemical and large-scale commercial projects. Specializes in fast-track turnarounds, power distribution upgrades, and mentoring apprentices transitioning into leadership roles.',
  availability: 'Open to long-term contract leadership roles starting in July 2024',
  travelRadius: 'Willing to travel up to 100 miles for priority projects',
  stats: [
    { label: 'Experience', value: '12 years' },
    { label: 'Crew size managed', value: '8-24 tradespeople' },
    { label: 'Notable projects', value: '17 delivered' },
  ],
  focusAreas: ['Power distribution upgrades', 'Industrial automation', 'Safety-first leadership'],
  skills: {
    core: [
      'High-voltage terminations',
      'Control panel commissioning',
      'Conduit fabrication',
      'QA/QC documentation',
    ],
    platforms: ['Allen-Bradley PLC', 'AutoCAD Electrical', 'Bluebeam Revu'],
    leadership: ['Crew scheduling', 'Mentorship programs', 'Client walkdowns'],
  },
  certifications: [
    {
      name: 'OSHA 30-Hour Construction Safety',
      issuer: 'Occupational Safety and Health Administration',
      status: 'Active · Expires Sep 2026',
    },
    { name: 'NCCER Electrical Level 4', issuer: 'NCCER', status: 'Active · Verified 2024' },
    { name: 'NFPA 70E Arc Flash Qualified', issuer: 'NFPA', status: 'Completed 2023' },
    { name: 'TWIC Credential', issuer: 'Transportation Security Administration', status: 'Active' },
  ],
  safetyHighlights: [
    'Zero recordable incidents across 6 consecutive turnarounds',
    'Leads weekly safety stand-downs with bilingual materials',
    'Implements lockout/tagout refreshers before each shift',
  ],
  languages: ['English', 'Spanish'],
  affiliations: 'IBEW Local 716 · NCCER Certified Instructor',
  projectHighlights: [
    {
      name: 'Baytown Petrochem Expansion',
      location: 'Baytown, TX',
      description:
        'Managed electrical scope for $28M power distribution upgrade, coordinating with mechanical and civil leads.',
      impact:
        'Delivered two weeks early with 0 safety incidents and a 15% reduction in rework hours.',
    },
    {
      name: 'Houston Ship Channel Automation Retrofit',
      location: 'La Porte, TX',
      description:
        'Led night-shift crew reconfiguring control panels and SCADA instrumentation while maintaining live operations.',
      impact:
        'Achieved 98% first-pass inspection rate and kept uptime above 92% throughout cutover.',
    },
  ],
  experience: [
    {
      company: 'Nexus Infrastructure',
      role: 'Senior Electrical Foreman',
      period: '2020 — Present',
      highlights: [
        'Supervise multi-discipline crews across petrochemical outages and brownfield upgrades.',
        'Introduced digital job hazard analyses that decreased incident reports by 22%.',
      ],
    },
    {
      company: 'Gridworks Construction',
      role: 'Electrical Foreman',
      period: '2016 — 2020',
      highlights: [
        'Oversaw installation of switchgear and MCCs for two 500,000 sq ft logistics centers.',
        'Developed bilingual onboarding playbook adopted across three regional offices.',
      ],
    },
    {
      company: 'Lighthouse Industrial Services',
      role: 'Journeyman Electrician',
      period: '2012 — 2016',
      highlights: [
        'Performed terminations and testing on MV cable pulls ranging from 5kV to 15kV.',
        'Supported QA/QC walkdowns and redlined drawings for engineering updates.',
      ],
    },
  ] satisfies WorkExperience[],
}

const similarUsers: SimilarUser[] = [
  {
    name: 'Marcus Chen',
    role: 'Electrical General Foreman',
    distance: '18 miles away',
    matchReason: 'High hire score · Industrial turnarounds',
    skills: ['Switchgear installs', 'Crew mentoring'],
    certifications: ['OSHA 30', 'NCCER Electrical Lv.4'],
  },
  {
    name: 'Serena Boyd',
    role: 'Instrumentation & Controls Lead',
    distance: '32 miles away',
    matchReason: 'Shared certifications · TWIC cleared',
    skills: ['PLC upgrades', 'Loop checks'],
    certifications: ['TWIC', 'ISA CCST II'],
  },
  {
    name: 'Luis Ortega',
    role: 'Electrical Superintendent',
    distance: '48 miles away',
    matchReason: 'Leads similar crew sizes · Spanish/English bilingual',
    skills: ['Medium voltage testing', 'Crew scheduling'],
    certifications: ['OSHA 30', 'NFPA 70E'],
  },
]

const initialsFromName = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

const InfoChip = ({ label }: { label: string }) => (
  <YStack px="$3" py="$1" br="$4" backgroundColor="$color3" borderWidth={1} borderColor="$color4">
    <Paragraph size="$2" color="$gray11">
      {label}
    </Paragraph>
  </YStack>
)

export const PublicProfileScreen = () => {
  return (
    <XStack
      w="100%"
      gap="$6"
      mx="auto"
      px="$4"
      py="$6"
      maw={1440}
      f={1}
      $md={{ flexDirection: 'column', gap: '$5' }}
    >
      <ScrollView
        f={1}
        showsVerticalScrollIndicator
        contentContainerStyle={{ gap: 24, paddingBottom: 32 }}
      >
        <YStack gap="$5" pb="$2" pr="$2">
          <DashboardCard gap="$5">
            <XStack gap="$4" $md={{ flexDirection: 'column', ai: 'flex-start' }}>
              <Avatar circular size="$6">
                <Avatar.Fallback backgroundColor="$blue6">
                  <SizableText color="$color1" fontWeight="700">
                    {initialsFromName(profile.name)}
                  </SizableText>
                </Avatar.Fallback>
              </Avatar>

              <YStack f={1} gap="$3">
                <YStack gap="$1">
                  <SizableText size="$7" fontWeight="700">
                    {profile.name}
                  </SizableText>
                  <Paragraph size="$3" color="$gray11">
                    {profile.headline}
                  </Paragraph>
                </YStack>

                <XStack gap="$3" flexWrap="wrap">
                  <XStack ai="center" gap="$2">
                    <MapPin size={16} color="$gray11" />
                    <Paragraph size="$2" color="$gray11">
                      {profile.location}
                    </Paragraph>
                  </XStack>
                  <XStack ai="center" gap="$2">
                    <Clock4 size={16} color="$gray11" />
                    <Paragraph size="$2" color="$gray11">
                      {profile.availability}
                    </Paragraph>
                  </XStack>
                </XStack>

                <Paragraph size="$3">{profile.summary}</Paragraph>

                <XStack gap="$3" flexWrap="wrap">
                  <InfoChip label={profile.travelRadius} />
                  <InfoChip label={profile.affiliations} />
                  <InfoChip label={`Languages: ${profile.languages.join(', ')}`} />
                </XStack>

                <XStack gap="$3" flexWrap="wrap">
                  <Button size="$3" icon={<Phone size={16} />} chromeless>
                    (832) 555-0198
                  </Button>
                  <Button size="$3" icon={<Briefcase size={16} />} chromeless>
                    Refer Alicia to a project
                  </Button>
                </XStack>
              </YStack>
            </XStack>

            <Separator borderColor="$color4" />

            <XStack gap="$4" flexWrap="wrap">
              {profile.stats.map((stat) => (
                <YStack key={stat.label} gap="$1" minWidth={180}>
                  <Paragraph size="$2" color="$gray11">
                    {stat.label}
                  </Paragraph>
                  <SizableText size="$6" fontWeight="600">
                    {stat.value}
                  </SizableText>
                </YStack>
              ))}
            </XStack>
          </DashboardCard>

          <DashboardCard gap="$4">
            <SectionHeading
              title="Focus areas"
              subtitle="Where Alicia adds the most value on site"
              icon={<Sparkles size={20} color="$blue10" />}
            />
            <YStack gap="$3">
              {profile.focusAreas.map((area) => (
                <XStack key={area} ai="center" gap="$3">
                  <BadgeCheck size={18} color="$green10" />
                  <Paragraph size="$3">{area}</Paragraph>
                </XStack>
              ))}
            </YStack>
          </DashboardCard>

          <DashboardCard gap="$4">
            <SectionHeading
              title="Skills & toolset"
              subtitle="Hands-on strengths and platforms"
              icon={<Briefcase size={20} color="$orange10" />}
            />
            <YStack gap="$3">
              <YStack gap="$2">
                <Paragraph size="$2" color="$gray11">
                  Field operations
                </Paragraph>
                <XStack gap="$2" flexWrap="wrap">
                  {profile.skills.core.map((skill) => (
                    <InfoChip key={skill} label={skill} />
                  ))}
                </XStack>
              </YStack>

              <YStack gap="$2">
                <Paragraph size="$2" color="$gray11">
                  Platforms & tooling
                </Paragraph>
                <XStack gap="$2" flexWrap="wrap">
                  {profile.skills.platforms.map((skill) => (
                    <InfoChip key={skill} label={skill} />
                  ))}
                </XStack>
              </YStack>

              <YStack gap="$2">
                <Paragraph size="$2" color="$gray11">
                  Leadership & coordination
                </Paragraph>
                <XStack gap="$2" flexWrap="wrap">
                  {profile.skills.leadership.map((skill) => (
                    <InfoChip key={skill} label={skill} />
                  ))}
                </XStack>
              </YStack>
            </YStack>
          </DashboardCard>

          <DashboardCard gap="$4">
            <SectionHeading
              title="Project highlights"
              subtitle="Recent wins that teammates ask her back for"
              icon={<Compass size={20} color="$purple10" />}
            />
            <YStack gap="$4">
              {profile.projectHighlights.map((project) => (
                <YStack key={project.name} gap="$2">
                  <XStack ai="center" gap="$2" flexWrap="wrap">
                    <SizableText size="$4" fontWeight="600">
                      {project.name}
                    </SizableText>
                    <Paragraph size="$2" color="$gray11">
                      {project.location}
                    </Paragraph>
                  </XStack>
                  <Paragraph size="$3">{project.description}</Paragraph>
                  <XStack ai="center" gap="$2">
                    <ShieldCheck size={16} color="$green10" />
                    <Paragraph size="$2" color="$gray11">
                      {project.impact}
                    </Paragraph>
                  </XStack>
                </YStack>
              ))}
            </YStack>
          </DashboardCard>

          <DashboardCard gap="$4">
            <SectionHeading
              title="Work history"
              subtitle="A quick look at where Alicia has led crews"
              icon={<Award size={20} color="$amber10" />}
            />
            <YStack gap="$4">
              {profile.experience.map((job) => (
                <YStack key={`${job.company}-${job.role}`} gap="$2">
                  <XStack jc="space-between" gap="$3" $sm={{ flexDirection: 'column', gap: '$1' }}>
                    <YStack gap="$1">
                      <SizableText size="$4" fontWeight="600">
                        {job.role}
                      </SizableText>
                      <Paragraph size="$2" color="$gray11">
                        {job.company}
                      </Paragraph>
                    </YStack>
                    <Paragraph size="$2" color="$gray11">
                      {job.period}
                    </Paragraph>
                  </XStack>
                  <YStack gap="$2">
                    {job.highlights.map((highlight) => (
                      <XStack key={highlight} ai="flex-start" gap="$2">
                        <Sparkles size={16} color="$blue10" style={{ marginTop: 2 }} />
                        <Paragraph size="$3" flex={1}>
                          {highlight}
                        </Paragraph>
                      </XStack>
                    ))}
                  </YStack>
                  <Separator borderColor="$color4" />
                </YStack>
              ))}
            </YStack>
          </DashboardCard>

          <DashboardCard gap="$4">
            <SectionHeading
              title="Safety & certifications"
              subtitle="Credentials that keep teams compliant"
              icon={<ShieldCheck size={20} color="$green10" />}
            />
            <YStack gap="$3">
              {profile.certifications.map((cert) => (
                <YStack key={cert.name} gap="$1">
                  <XStack ai="center" gap="$2" flexWrap="wrap">
                    <BadgeCheck size={18} color="$green10" />
                    <SizableText size="$3" fontWeight="600">
                      {cert.name}
                    </SizableText>
                  </XStack>
                  <Paragraph size="$2" color="$gray11">
                    {cert.issuer} · {cert.status}
                  </Paragraph>
                </YStack>
              ))}
            </YStack>

            <Separator borderColor="$color4" />

            <YStack gap="$2">
              {profile.safetyHighlights.map((highlight) => (
                <XStack key={highlight} ai="flex-start" gap="$2">
                  <ShieldCheck size={16} color="$green10" style={{ marginTop: 2 }} />
                  <Paragraph size="$3" flex={1}>
                    {highlight}
                  </Paragraph>
                </XStack>
              ))}
            </YStack>
          </DashboardCard>
        </YStack>
      </ScrollView>

      <YStack width={360} gap="$4" flexShrink={0} $md={{ width: '100%' }}>
        <DashboardCard gap="$4">
          <SectionHeading
            title="Similar users"
            subtitle="People hiring managers also view"
            icon={<Users size={20} color="$purple10" />}
            action={<Button size="$2">View all</Button>}
          />
          <YStack gap="$4">
            {similarUsers.map((candidate, index) => (
              <YStack key={candidate.name} gap="$3">
                <XStack ai="center" gap="$3">
                  <Avatar circular size="$3">
                    <Avatar.Fallback backgroundColor="$blue5">
                      <SizableText color="$color1" fontWeight="600">
                        {initialsFromName(candidate.name)}
                      </SizableText>
                    </Avatar.Fallback>
                  </Avatar>
                  <YStack f={1} gap="$1">
                    <SizableText size="$3" fontWeight="600">
                      {candidate.name}
                    </SizableText>
                    <Paragraph size="$2" color="$gray11">
                      {candidate.role}
                    </Paragraph>
                  </YStack>
                  <Paragraph size="$2" color="$gray11">
                    {candidate.distance}
                  </Paragraph>
                </XStack>

                <YStack gap="$2">
                  <Paragraph size="$2" color="$gray11">
                    {candidate.matchReason}
                  </Paragraph>
                  <XStack gap="$2" flexWrap="wrap">
                    {candidate.skills.map((skill) => (
                      <InfoChip key={`${candidate.name}-${skill}`} label={skill} />
                    ))}
                  </XStack>
                  <XStack gap="$2" flexWrap="wrap">
                    {candidate.certifications.map((cert) => (
                      <InfoChip key={`${candidate.name}-${cert}`} label={cert} />
                    ))}
                  </XStack>
                </YStack>

                {index < similarUsers.length - 1 ? <Separator borderColor="$color4" /> : null}
              </YStack>
            ))}
          </YStack>
        </DashboardCard>

        <DashboardCard gap="$3">
          <SectionHeading
            title="Ready to reach out?"
            subtitle="Send Alicia a note with project details"
            icon={<Phone size={20} color="$blue10" />}
          />
          <Paragraph size="$3">
            Share scope, schedule, and crew requirements to fast-track introductions. Alicia
            typically responds within one business day.
          </Paragraph>
          <Button size="$3" icon={<Mail size={16} />} iconAfter={<Compass size={16} />}>
            Message Alicia
          </Button>
        </DashboardCard>
      </YStack>
    </XStack>
  )
}
