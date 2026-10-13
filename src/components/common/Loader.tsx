import { useTranslation } from "react-i18next";
import "@/assets/scss/common/Loader.scss";

type LoaderProps = {
  withoutShadow?: boolean;
};

const Loader = ({ withoutShadow = false }: LoaderProps) => {
  const { t } = useTranslation();

  const className = [
    "progress",
    "form",
    withoutShadow ? "without-shadow" : null,
  ].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <div className="progress__text">
        {t("components.loader")}
      </div>

      <div className="progress__bar bar">
        <div className="bar__wrapper">
          <div className="bar__line" />
          <div className="bar__line" />
          <div className="bar__line" />
          <div className="bar__line" />
          <div className="bar__line" />
          <div className="bar__line" />
        </div>
      </div>
    </div>
  );
};

export default Loader;