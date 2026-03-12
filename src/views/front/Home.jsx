import { useTranslation } from "react-i18next";

function Home() {
  const { t } = useTranslation();
  return <p>{t("home.title")}</p>;
}

export default Home;
