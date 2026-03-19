import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { api, localizedName, primaryImageUrl, priceRange } from "../../utils/api";
import { currency } from "../../utils/currency";
import { emailValidation } from "../../utils/validation";

import storyBg from "../../assets/images/story-bg.jpg";
import subsBg from "../../assets/images/sub_bg.png";
import subWeek from "../../assets/images/sub_week.png";
import subRent from "../../assets/images/sub_rent.png";

// ── Scroll-reveal hook ──
function useReveal() {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef(null);

  const ref = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observerRef.current.observe(node);
  }, []);

  return [ref, visible];
}

// ── Hero ──
function HeroSection() {
  const { t } = useTranslation();

  const scrollDown = () => {
    document
      .querySelector(".home-features")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="home-hero">
      <div className="container home-hero__content">
        <p className="home-hero__eyebrow">{t("home.hero.eyebrow")}</p>
        <h1 className="home-hero__title">{t("home.hero.title")}</h1>
        <p className="home-hero__subtitle">{t("home.hero.subtitle")}</p>
        <NavLink to="/products" className="btn btn-primary home-hero__cta">
          {t("home.hero.cta")}
          <i className="bi bi-arrow-right ms-2" />
        </NavLink>
      </div>
      <button
        className="home-hero__scroll"
        onClick={scrollDown}
        aria-label="Scroll down"
      >
        <i className="bi bi-chevron-down" />
      </button>
    </section>
  );
}

// ── Features ──
const FEATURES = [
  { icon: "bi-patch-check", key: "item1" },
  { icon: "bi-book", key: "item2" },
  { icon: "bi-box-seam", key: "item3" },
];

function FeaturesSection() {
  const { t } = useTranslation();
  const [ref, visible] = useReveal();

  return (
    <section className="home-features">
      <div className="container">
        <div className={`reveal ${visible ? "is-visible" : ""}`} ref={ref}>
          <p className="home-features__eyebrow">{t("home.features.eyebrow")}</p>
          <h2 className="home-features__heading">
            {t("home.features.heading")}
          </h2>
        </div>
        <div className="row g-4">
          {FEATURES.map(({ icon, key }, i) => (
            <div className="col-md-4" key={key}>
              <div
                className={`home-features__card reveal ${visible ? "is-visible" : ""}`}
                style={{ "--reveal-delay": `${i * 0.12}s` }}
              >
                <i className={`bi ${icon}`} />
                <h3>{t(`home.features.${key}.title`)}</h3>
                <p>{t(`home.features.${key}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Brand Story ──
function StorySection() {
  const { t } = useTranslation();
  const [ref, visible] = useReveal();

  return (
    <section className="home-story">
      <div className="container">
        <div className="row align-items-center g-5" ref={ref}>
          <div className={`col-lg-6 reveal ${visible ? "is-visible" : ""}`}>
            <div className="home-story__img-wrap">
              <img src={storyBg} alt="Brand story" />
            </div>
          </div>
          <div
            className={`col-lg-6 reveal ${visible ? "is-visible" : ""}`}
            style={{ "--reveal-delay": "0.18s" }}
          >
            <span className="home-story__eyebrow">
              {t("home.story.eyebrow")}
            </span>
            <h2 className="home-story__title">{t("home.story.title")}</h2>
            <p className="home-story__text">{t("home.story.p1")}</p>
            <p className="home-story__text">{t("home.story.p2")}</p>
            <NavLink to="/products" className="btn btn-primary mt-2">
              {t("home.story.cta")}
              <i className="bi bi-arrow-right ms-2" />
            </NavLink>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Subscription (Coming Soon) ──
const SUBSCRIPTIONS = [
  { id: "weekly", img: subWeek },
  { id: "rental", img: subRent },
];

function SubscriptionSection() {
  const { t } = useTranslation();
  const [ref, visible] = useReveal();

  return (
    <section
      className="home-subs"
      style={{ backgroundImage: `url(${subsBg})` }}
    >
      <div className="home-subs__overlay" aria-hidden="true" />
      <div className="container home-subs__content">
        <div
          className={`text-center reveal ${visible ? "is-visible" : ""}`}
          ref={ref}
        >
          <p className="home-subs__eyebrow">{t("home.subs.eyebrow")}</p>
          <h2 className="home-subs__heading">{t("home.subs.heading")}</h2>
        </div>

        <div className="home-subs__list">
          {SUBSCRIPTIONS.map(({ id, img }, i) => (
            <div
              key={id}
              className={`home-subs__item reveal ${visible ? "is-visible" : ""}`}
              style={{ "--reveal-delay": `${i * 0.15}s` }}
            >
              <div className="home-subs__item__img">
                <img src={img} alt={t(`home.subs.${id}.title`)} />
              </div>
              <div className="home-subs__item__body">
                <span className="home-subs__badge">
                  <i className="bi bi-clock-history me-1" />
                  {t("home.subs.comingSoon")}
                </span>
                <h3>{t(`home.subs.${id}.title`)}</h3>
                <p>{t(`home.subs.${id}.desc`)}</p>
                <div className="d-flex gap-3 flex-wrap">
                  <button className="btn btn-primary" disabled>
                    {t("home.subs.subscribeBtn")}
                  </button>
                  <button className="btn btn-outline-primary" disabled>
                    {t("home.subs.viewMoreBtn")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Featured Products ──
function FeaturedSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ref, visible] = useReveal();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api
      .get("/api/v1/products?page=1")
      .then((res) => setProducts((res.data.items ?? []).slice(0, 4)))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="home-featured">
      <div className="container">
        <div
          className={`text-center reveal ${visible ? "is-visible" : ""}`}
          ref={ref}
        >
          <p className="home-featured__eyebrow">{t("home.featured.eyebrow")}</p>
          <h2 className="home-featured__heading">
            {t("home.featured.heading")}
          </h2>
        </div>
        <div className="row g-4 justify-content-center">
          {products.map((p, i) => {
            const imgUrl = primaryImageUrl(p.images);
            const range = priceRange(p.variants);
            return (
              <div className="col-sm-6 col-lg-3" key={p.id}>
                <div
                  className={`home-featured__card reveal ${visible ? "is-visible" : ""}`}
                  style={{ "--reveal-delay": `${i * 0.12}s` }}
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  {imgUrl && <img src={imgUrl} alt={localizedName(p.name)} />}
                  <div className="home-featured__card__body">
                    <p className="home-featured__card__name">{localizedName(p.name)}</p>
                    <p className="home-featured__card__latin">
                      {p.scientificName || localizedName(p.category?.name)}
                    </p>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="home-featured__card__price">
                        {range.min === range.max
                          ? `NT$ ${currency(range.min)}`
                          : `NT$ ${currency(range.min)} ~`}
                      </span>
                      <span className="btn btn-outline-primary btn-sm">
                        {t("home.featured.viewDetail")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-5">
          <NavLink to="/products" className="btn btn-outline-primary px-4">
            {t("home.featured.viewAll")}
            <i className="bi bi-arrow-right ms-2" />
          </NavLink>
        </div>
      </div>
    </section>
  );
}

// ── Contact ──
const MAP_SRC_BASE =
  "https://maps.google.com/maps?q=512%E5%BD%B0%E5%8C%96%E7%B8%A3%E6%B0%B8%E9%9D%96%E9%84%89%E4%BC%B4%E6%97%A5%E5%9C%92%E8%97%9D" +
  "&ftid=0x346935f67ef418c1:0xe8a66812aa9acb20&output=embed&z=17";

const SOCIALS = [
  {
    icon: "bi-facebook",
    href: "https://www.facebook.com/p/%E4%BC%B4%E6%97%A5%E5%9C%92%E8%97%9D-100063472974027/",
    label: "Facebook",
  },
  {
    icon: "bi-instagram",
    href: "https://www.instagram.com/explore/locations/479997752495707/",
    label: "Instagram",
  },
  { icon: "bi-line", href: "https://page.line.me/gzj4157l", label: "LINE" },
];

function ContactSection() {
  const { t, i18n } = useTranslation();
  const [ref, visible] = useReveal();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: { name: "", email: "", message: "" },
  });

  useEffect(() => {
    const fields = Object.keys(errors);
    if (fields.length > 0) trigger(fields);
  }, [i18n.language, trigger, errors]);

  const mapSrc = `${MAP_SRC_BASE}&hl=${i18n.language}`;

  return (
    <section className="home-contact">
      <div className="row g-0 align-items-stretch">
        <div className="col-lg-6 home-contact__map-wrap">
          <iframe
            src={mapSrc}
            title="伴日 Banri 地圖"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="col-lg-6">
          <div
            className={`home-contact__panel reveal ${visible ? "is-visible" : ""}`}
            ref={ref}
          >
            <i
              className="bi bi-leaf home-contact__watermark"
              aria-hidden="true"
            />
            <h2 className="home-contact__heading">
              {t("home.contact.heading")}
            </h2>

            {submitted ? (
              <div className="home-contact__success">
                <i className="bi bi-check-circle-fill" />
                <h3>{t("home.contact.successTitle")}</h3>
                <p>{t("home.contact.successDesc")}</p>
              </div>
            ) : (
              <form
                className="home-contact__form"
                onSubmit={handleSubmit(() => setSubmitted(true))}
                noValidate
              >
                <div className="home-contact__field">
                  <label>
                    {t("home.contact.nameLabel")}
                    <span> *</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("home.contact.namePlaceholder")}
                    className={errors.name ? "is-invalid" : ""}
                    {...register("name", {
                      required: t("home.contact.nameRequired"),
                    })}
                  />
                  {errors.name && (
                    <span className="home-contact__err">
                      {errors.name.message}
                    </span>
                  )}
                </div>

                <div className="home-contact__field">
                  <label>
                    {t("home.contact.emailLabel")}
                    <span> *</span>
                  </label>
                  <input
                    type="email"
                    placeholder={t("home.contact.emailPlaceholder")}
                    className={errors.email ? "is-invalid" : ""}
                    {...register("email", emailValidation(t))}
                  />
                  {errors.email && (
                    <span className="home-contact__err">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                <div className="home-contact__field">
                  <label>
                    {t("home.contact.messageLabel")}
                    <span> *</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder={t("home.contact.messagePlaceholder")}
                    className={errors.message ? "is-invalid" : ""}
                    {...register("message", {
                      required: t("home.contact.messageRequired"),
                    })}
                  />
                  {errors.message && (
                    <span className="home-contact__err">
                      {errors.message.message}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary home-contact__submit w-100"
                >
                  {t("home.contact.submit")}
                </button>

                <div className="home-contact__divider">
                  <span>{t("home.contact.or")}</span>
                </div>

                <div className="home-contact__socials">
                  {SOCIALS.map(({ icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      className="home-contact__social-btn"
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className={`bi ${icon}`} />
                    </a>
                  ))}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Page ──
function Home() {
  return (
    <div className="home-page">
      <HeroSection />
      <FeaturesSection />
      <StorySection />
      <SubscriptionSection />
      <FeaturedSection />
      <ContactSection />
    </div>
  );
}

export default Home;
