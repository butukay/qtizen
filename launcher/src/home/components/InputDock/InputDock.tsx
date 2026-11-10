import type { InputSource } from "../../../contracts/launcher";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import type { HomeEnvironment } from "../../types";
import { HomeSectionHeading } from "../HomeSectionHeading/HomeSectionHeading";
import { InputCard } from "../InputCard/InputCard";

import styles from "./InputDock.module.css";

export const InputDock = ({ env, inputs }: { env: HomeEnvironment; inputs: readonly InputSource[] }) => {
  const { t } = useTranslation();
  return (
    <section id="inputs-section" data-home-section="inputs" hidden={!inputs.length}>
      <HomeSectionHeading title={t("common.inputs")} />
      <div id="inputs" class={styles.dock} data-input-dock>
        {inputs.map((source) => (
          <InputCard key={env.runtime.inputs.portName(source)} env={env} source={source} />
        ))}
      </div>
    </section>
  );
};
