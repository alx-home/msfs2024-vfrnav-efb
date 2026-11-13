import {
  donationText,
  donationUrls,
  resourceUrls,
  translations,
  type Language
} from "../content";
import SectionHeading from "../components/SectionHeading";
import { donationDetails } from "../content/support";
import SupportIcon from "../components/SupportIcon";
import donationIcon from "../assets/donation.svg";
import liberapayIcon from "../assets/liberpay.svg";
import paypalIcon from "../assets/paypal-donate.svg";
import coffeeIcon from "../assets/buymeacoffee.svg";

const resourceIcons = ["download", "book", "issue", "community", "code", "feedback"] as const;
const donationIcons = [liberapayIcon, paypalIcon, coffeeIcon];

function SupportPage({ language }: { language: Language }) {
  const text = translations[language];
  const donations = donationText[language];
  const details = donationDetails[language];

  return (
    <section id="support" className="scroll-mt-24 py-[clamp(3.4rem,7vw,5rem)] max-[900px]:scroll-mt-4 max-[600px]:py-10">
      <SectionHeading title={text.support[0]} description={text.support[1]} />
      <div>
        <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {text.support[2].map((label, index) => (
            <a className={`support-link flex min-w-0 items-center gap-4 rounded-[14px] border p-5 font-semibold text-ink no-underline transition-[border-color,background-color] duration-200 hover:border-accent hover:bg-raised hover:bg-none ${index === 0 ? "border-accent/50 bg-[linear-gradient(135deg,rgba(97,213,194,.18),#111c2c)]" : "border-line bg-[linear-gradient(135deg,#172437,#111c2c)]"}`}
              href={resourceUrls[index]} key={resourceUrls[index]}>
              <span className="grid h-11 flex-[0_0_44px] place-items-center rounded-xl bg-accent/8 text-accent [&>svg]:size-[25px]"><SupportIcon name={resourceIcons[index]} /></span>
              <span>{label}</span>
              <span className="ml-auto flex-[0_0_20px] text-accent"><SupportIcon name="arrow" /></span>
            </a>
          ))}
        </div>
        <div className="donation-block mt-8 rounded-[18px] border border-accent/25 bg-surface bg-[radial-gradient(ellipse_at_top_left,rgba(97,213,194,.1),transparent_70%)] p-[clamp(1.2rem,3vw,2rem)]">
          <h3 className="mb-[.6rem] flex items-center gap-[.8rem] text-[1.17em] font-bold"><img className="shrink-0" src={donationIcon} alt="" width="32" height="32" />{donations[0]}</h3>
          <p className="mb-4 text-muted">{donations[1]}</p>
          <div className="donation-links mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
            {donations[2].map((label, index) => (
              <a className={`donation-link relative row-span-3 grid min-w-0 grid-cols-[minmax(0,1fr)_20px] grid-rows-subgrid content-start items-start gap-[.8rem] rounded-[14px] border bg-[linear-gradient(135deg,#172437,#111c2c)] p-5 pt-7 font-semibold text-ink no-underline transition-[border-color,background-color] duration-200 hover:border-accent hover:bg-raised hover:bg-none ${index === 0 ? "border-green-400/40" : "border-line"}`}
                href={donationUrls[index]} key={donationUrls[index]}>
                {index < details.badges.length && (
                  <span className={`donation-badge absolute top-0 left-5 -mt-px max-w-[calc(100%_-_2.5rem)] -translate-y-1/2 rounded-md border px-[.65rem] py-[.2rem] text-xs leading-normal ${index === 0 ? "border-[#228b4d] bg-[#166534] text-white" : "border-[#b3cde6]/30 bg-[#28374d] text-ink"}`}>{details.badges[index]}</span>
                )}
                <span className="donation-brand col-span-full row-start-1 flex h-14 w-full items-center">
                  <img className={`block object-contain ${index === 1 ? "size-11 max-w-full" : index === 2 ? "h-auto max-h-[52px] max-w-[min(100%,180px)]" : "h-[35px] w-auto max-w-full"}`} src={donationIcons[index]} alt="" />
                </span>
                <span className="donation-label col-start-1 row-start-2 min-w-0">{label}</span>
                <span className="col-start-2 row-start-2 self-center text-accent"><SupportIcon name="arrow" /></span>
                <span className="donation-note col-span-full row-start-3 w-full text-[.82rem] font-normal text-muted">{details.notes[index]}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SupportPage;
