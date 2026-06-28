import Link from "next/link";
import { onboardingSummary, type OnboardingStep, type OnboardingStepStatus } from "@/lib/onboarding";

const STATUS_LABEL: Record<OnboardingStepStatus, string> = {
  done: "Bereit",
  active: "Jetzt",
  open: "Danach",
  blocked: "Wartet",
};

type OnboardingChecklistProps = {
  title: string;
  label?: string;
  steps: OnboardingStep[];
  description?: string;
  compact?: boolean;
};

export function OnboardingChecklist({ title, label, steps, description, compact = false }: OnboardingChecklistProps) {
  const summary = onboardingSummary(steps);

  return (
    <section className={`onboarding-checklist${compact ? " onboarding-checklist-compact" : ""}`} aria-label={title}>
      <div className="onboarding-checklist-head">
        <div>
          {label ? <p className="mono-label">{label}</p> : null}
          <h2 className="detail-title-small">{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <p className="onboarding-progress" aria-label={`Fortschritt ${summary.label}`}>
          {summary.label}
        </p>
      </div>

      <ol className="onboarding-steps">
        {steps.map((step, index) => (
          <li
            className={`onboarding-step onboarding-step-${step.status}`}
            data-onboarding-status={step.status}
            key={step.id}
            aria-current={step.status === "active" ? "step" : undefined}
          >
            <span className="onboarding-step-marker" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="onboarding-step-body">
              <div className="onboarding-step-title-row">
                <strong>{step.title}</strong>
                <span>{STATUS_LABEL[step.status]}</span>
              </div>
              <p>{step.text}</p>
              {step.href && step.actionLabel ? (
                <Link className="text-link" href={step.href}>
                  {step.actionLabel}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
