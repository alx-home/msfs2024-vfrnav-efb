import { useState, type MouseEvent } from "react";
import donationImg from '@vfrnav/images/donation.svg';
import paypalImg from '@vfrnav/images/paypal-donate.svg';
import buymeaCoffeeImg from '@vfrnav/images/buymeacoffee.svg?inline';
import liberpayImg from '@vfrnav/images/liberpay.svg';
import { useTranslation } from "@vfrnav/i18n";

export const Donation = () => {
   const { t } = useTranslation();

   const [donationError, setDonationError] = useState('');
   const openDonation = async (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      const url = event.currentTarget.href;
      setDonationError('');

      try {
         await globalThis.window.openDonationLink(url);
      } catch (reason) {
         setDonationError(reason instanceof Error ? reason.message : String(reason));
      }
   };

   return <div className='flex grow items-center justify-center overflow-y-auto bg-center bg-cover p-6'
      style={{ backgroundImage: `url(${donationImg})` }}  >
      <section aria-labelledby='donation-title'
         className='my-auto flex w-full max-w-xl flex-col gap-5 rounded-sm border border-slate-700 bg-slate-800/95 p-6 text-white shadow-xl'>
         <h1 id='donation-title' className='text-xl font-semibold'>{t('donation.title')}</h1>
         <p className='text-sm text-slate-300 space-y-4'>
            {t('donation.intro')} <br /><br />
            {t('donation.soloDeveloper')}
            <br /><br />
            {t('donation.copilotCost')}<br /> {t('donation.supportImpact')} <br /><br />{t('donation.thankYou')}
         </p>
         <div className='relative flex flex-col gap-3'>
            <div className="shadow-[0_0_10px_rgba(34,197,94,.15)]">
               <a href='https://liberapay.com' target='_blank' rel='noopener noreferrer'
                  onClick={openDonation}
                  className='relative flex flex-col items-center justify-center gap-3 rounded-sm border border-slate-600 bg-gray-800 px-4 py-3 pt-4 font-semibold shadow-md transition-colors hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-msfs'>
                  <div className='flex items-center gap-2'>
                     <span>Liberapay</span>
                     <img src={liberpayImg} alt={t('donation.donateAlt')} className='h-7' />
                  </div>
                  <div className="text-xs text-slate-400">
                     {t('donation.liberapaySubtitle')}
                  </div>
                  <span className="absolute left-4 -top-1 text-xs shadow-sm font-normal bg-green-700 text-white border border-green-600 px-2 py-1 rounded-sm">
                     {t('donation.preferredBadge')}
                  </span>
               </a>
            </div>
            <a href='https://paypal.com'
               onClick={openDonation}
               target='_blank' rel='noopener noreferrer'
               aria-label={t('donation.paypalAriaLabel')}
               className='relative flex flex-col items-center justify-center gap-2 rounded-sm border border-slate-600 bg-gray-800 px-4 py-3 pt-4 shadow-md transition-colors hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-msfs'>
               <div className='flex items-center gap-2 bg-blue-700 px-8 py-2 rounded-full'>
                  <img src={paypalImg} alt={t('donation.paypalAlt')} className='h-7 w-auto shrink-0' />
                  <div className='flex items-center whitespace-nowrap text-xl font-semibold'>{t('donation.donateButton')}</div>
               </div>
               <div className="text-xs text-slate-400">
                  {t('donation.paypalSubtitle')}
               </div>
               <span className="absolute left-4 -top-1 text-xs shadow-sm font-normal bg-slate-700 text-white border border-slate-600 px-2 py-1 rounded-sm">
                  {t('donation.convenientBadge')}
               </span>
            </a>
            <a href='https://buymeacoffee.com' target='_blank' rel='noopener noreferrer'
               onClick={openDonation}
               className={`flex flex-col gap-2 items-center justify-center rounded-sm 
               border border-slate-600 bg-gray-800 px-4 py-3 pt-4 text-center font-semibold shadow-md transition-colors
               hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-msfs`}>
               <img src={buymeaCoffeeImg}
                  alt={t('donation.buyMeACoffeeAlt')} className='h-10 max-w-full object-contain' />
               <div className="text-xs text-slate-400">
                  {t('donation.buyMeACoffeeSubtitle')}
               </div>
            </a>
         </div>
         {donationError && <p role='alert' className='text-sm text-red-300'>{donationError}</p>}
      </section>
   </div>;
}
