import { useState, type MouseEvent } from "react";
import donationImg from '@vfrnav/images/donation.svg';
import paypalImg from '@vfrnav/images/paypal-donate.svg';

export const Donation = () => {
   const [donationError, setDonationError] = useState('');
   const openDonation = async (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      const url = event.currentTarget.href;
      setDonationError('');

      try {
         await globalThis.window.openDonationLink(url);
      } catch (reason) {
         console.error('Cannot open donation link:', reason);
         setDonationError(reason instanceof Error ? reason.message : String(reason));
      }
   };


   return <div className='flex grow items-center justify-center overflow-y-auto bg-center bg-cover p-6'
      style={{ backgroundImage: `url(${donationImg})` }}  >
      <section aria-labelledby='donation-title'
         className='my-auto flex w-full max-w-md flex-col gap-5 rounded-sm border border-slate-700 bg-slate-800/95 p-6 text-white shadow-xl'>
         <h1 id='donation-title' className='text-xl font-semibold'>Support VFRNav</h1>
         <p className='text-sm text-slate-300'>
            Enjoying VFRNav? <br /><br />
            I develop and maintain it alone, dedicating a large part of my free time to it every day.
            <br /><br />
            Working solo, Copilot has become an essential tool for keeping development moving,
            but its cost is significant. Your donation helps cover these expenses and supports
            the time and effort behind VFRNav. Thank you!
         </p>
         <div className='flex flex-col gap-3'>
            <a href='https://www.paypal.com/donate/?hosted_button_id=UFLZE3KQB78Z4'
               onClick={openDonation}
               target='_blank' rel='noopener noreferrer'
               aria-label='Donate with PayPal (preferred)'
               className='flex flex-col items-center justify-center gap-2 rounded-sm border border-slate-600 bg-gray-800 px-4 py-3 shadow-md transition-colors hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-msfs'>
               <img src={paypalImg} alt='Donate with PayPal' className='h-[35px] w-full' />
               <span className='text-xs font-normal text-slate-300'>Preferred</span>
            </a>
            <a href='https://buymeacoffee.com/alex.home' target='_blank' rel='noopener noreferrer'
               onClick={openDonation}
               className='flex items-center justify-center rounded-sm border border-slate-600 bg-gray-800 px-4 py-3 text-center font-semibold shadow-md transition-colors hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-msfs'>
               <img src='https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png'
                  alt='Buy Me a Coffee' className='h-12 max-w-full object-contain' />
            </a>
            <a href='https://liberapay.com/alex-home/donate' target='_blank' rel='noopener noreferrer'
               onClick={openDonation}
               className='flex items-center justify-center gap-3 rounded-sm border border-slate-600 bg-gray-800 px-4 py-3 font-semibold shadow-md transition-colors hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-msfs'>
               <span>Liberapay</span>
               <img src='https://liberapay.com/assets/widgets/donate.svg' alt='Donate' className='h-7' />
            </a>
         </div>
         {donationError && <p role='alert' className='text-sm text-red-300'>{donationError}</p>}
      </section>
   </div>;
}