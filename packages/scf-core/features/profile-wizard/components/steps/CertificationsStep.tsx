import { randomUUID } from "expo-crypto";
import { useEffect, useId, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  Input,
  Label,
  Paragraph,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { MonthYearPicker } from "../../../profile/components/MonthYearPicker";
import type {
  CertificationEntry,
  CertificationsStepData,
} from "../../hooks/useProfileWizard";
import { StepNavigation } from "../StepNavigation";
import type { WizardStepComponentProps } from "./types";

export function CertificationsStep({
  initialData,
  isSaving,
  isLastStep,
  onBack,
  onContinue,
  onSaveForLater,
  onSkip,
  onStepStateChange,
}: WizardStepComponentProps<"certifications">) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
  const [certifications, setCertifications] = useState<CertificationEntry[]>(
    initialData?.certifications ?? []
  );
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedOn, setIssuedOn] = useState<Date | null>(null);
  const [expiresOn, setExpiresOn] = useState<Date | null>(null);
  const guidanceId = useId();
  const certNameId = useId();
  const issuerId = useId();

  useEffect(() => {
    if (initialData?.certifications) {
      setCertifications(initialData.certifications);
    }
  }, [initialData]);

  const hasMinimum = certifications.length > 0;

  const baselineKey = useMemo(
    () => serializeCertifications(initialData?.certifications ?? []),
    [initialData?.certifications]
  );
  const currentKey = useMemo(
    () => serializeCertifications(certifications),
    [certifications]
  );
  const isDirty = baselineKey !== currentKey;

  useEffect(() => {
    const payload: CertificationsStepData = {
      certifications,
    };
    onStepStateChange?.({
      data: payload,
      isValid: true,
      isDirty,
    });
  }, [certifications, isDirty, onStepStateChange]);

  const addCertification = () => {
    if (!name.trim() || !issuer.trim()) return;

    const entry: CertificationEntry = {
      id: randomUUID(),
      name: name.trim(),
      issuer: issuer.trim(),
      issuedOn: issuedOn ? formatWizardDate(issuedOn) : null,
      expiresOn: expiresOn ? formatWizardDate(expiresOn) : null,
    };
    setCertifications((prev) => [...prev, entry]);
    setName("");
    setIssuer("");
    setIssuedOn(null);
    setExpiresOn(null);
  };

  const removeCertification = (id?: string) => {
    if (!id) return;
    setCertifications((prev) => prev.filter((cert) => cert.id !== id));
  };

  const handleContinue = async () => {
    await onContinue({ certifications });
  };

  const handleSaveForLater = async () => {
    await onSaveForLater?.({ certifications });
  };

  const handleSkip = async () => {
    await onSkip?.();
  };

  const helperCopy = useMemo(() => {
    if (hasMinimum) {
      return "Looking great! Keep adding relevant licenses or credentials.";
    }
    return "Optional but recommended—add any professional certifications or licenses you hold.";
  }, [hasMinimum]);

  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text>Add certifications & licenses</Text>
        <Paragraph id={guidanceId} style={{ color: colors.text[t].secondary }} aria-live="polite">
          {helperCopy}
        </Paragraph>
      </Stack>

      <Stack gap={12}>
        {certifications.map((cert) => (
          <Card key={cert.id ?? cert.name} bordered style={{ backgroundColor: colors.bg[t].muted }}>
            <CardHeader>
              <Stack gap={8}>
                <Row justify="space-between" align="center">
                  <Stack gap={4}>
                    <Text>{cert.name}</Text>
                    {cert.issuer && <Text style={{ color: colors.text[t].secondary }}>{cert.issuer}</Text>}
                    <Row gap={8}>
                      {cert.issuedOn && (
                        <Text style={{ color: colors.text[t].secondary }}>
                          Issued {formatDisplayDate(cert.issuedOn)}
                        </Text>
                      )}
                      {cert.expiresOn && (
                        <Text style={{ color: colors.text[t].secondary }}>
                          • Expires {formatDisplayDate(cert.expiresOn)}
                        </Text>
                      )}
                    </Row>
                  </Stack>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => removeCertification(cert.id)}
                    aria-label={`Remove ${cert.name}`}
                  >
                    Remove
                  </Button>
                </Row>
              </Stack>
            </CardHeader>
          </Card>
        ))}
      </Stack>

      <Stack gap={12}>
        <Stack gap={8}>
          <Label htmlFor={certNameId}>Certification name</Label>
          <Input
            id={certNameId}
            placeholder="OSHA 30-Hour Construction Safety"
            value={name}
            onChangeText={setName}
          />
        </Stack>
        <Stack gap={8}>
          <Label htmlFor={issuerId}>Issuing organization</Label>
          <Input
            id={issuerId}
            placeholder="Occupational Safety and Health Administration"
            value={issuer}
            onChangeText={setIssuer}
          />
        </Stack>
        <Row gap={12}>
          <Stack flex={1} gap={8}>
            <MonthYearPicker
              label="Issued on"
              value={issuedOn}
              onChange={setIssuedOn}
            />
          </Stack>
          <Stack flex={1} gap={8}>
            <MonthYearPicker
              label="Expires on"
              value={expiresOn}
              onChange={setExpiresOn}
            />
          </Stack>
        </Row>
        <Button
          onPress={addCertification}
          disabled={!name.trim() || !issuer.trim()}
        >
          Add Certification
        </Button>
      </Stack>

      <StepNavigation
        canGoBack
        canGoNext
        isLastStep={isLastStep}
        isSaving={isSaving}
        onBack={onBack}
        onNext={handleContinue}
        onSkip={onSkip ? handleSkip : undefined}
        onSaveForLater={onSaveForLater ? handleSaveForLater : undefined}
        nextLabel="Next: Preferences"
        skipLabel="Skip Certifications"
      />
    </Stack>
  );
}

function serializeCertifications(items: CertificationEntry[]): string {
  return items
    .map(
      (item) =>
        `${item.id ?? item.name}:${item.issuer}:${item.issuedOn ?? ""}:${
          item.expiresOn ?? ""
        }`
    )
    .sort()
    .join("|");
}

function formatWizardDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}-01`;
}

function formatDisplayDate(value: string): string {
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    1
  );
  return date.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}
