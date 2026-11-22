import { useCallback } from "react";
import { useServer } from '@server-common/Hooks';
import { useTranslation } from '@vfrnav/i18n';

export const Element = ({ label, onClick, disabled, hideTaskbar }: {
  label: string,
  disabled?: boolean,
  hideTaskbar?: boolean,
  onClick?: () => void
}) => {
  return <button className="flex flex-row items-center text-left whitespace-nowrap p-1 transition-all hocus:bg-gray-800 hocus:shadow-xl rounded-sm hocus:pl-6 disabled:opacity-20" disabled={disabled}
    onClick={e => {
      e.currentTarget.blur()

      if (hideTaskbar ?? true) {
        window.hideTaskbar()
      }

      onClick?.()
    }}
  >
    {label}
  </button>
};

export const Separator = () => {
  return <div className="flex flex-row w-full h-[2px] bg-slate-200 bg-opacity-30 shadow-black shadow-opacity-1/4 shadow-sm my-2"></div>
}

export const App = () => {
  const { t } = useTranslation();
  const exit = useCallback(() => { window.abort() }, []);
  const showSettings = useCallback(() => { window.showSettings() }, []);
  const { serverState, serverStateStr, switchServer, serverLock } = useServer();

  return <div className='flex flex-col h-full text-sm '>
    <div className='relative flex flex-col h-full w-full border-2 overflow-hidden px-4 pt-2'>
      <Element onClick={window.openEFB} label={t('taskbar.openInApp')} />
      <Element disabled={serverState != 'running'} label={t('taskbar.openInBrowser')} onClick={window.openWebEFB} />
      <Separator />
      <Element label={
        serverStateStr
      } disabled={serverLock} hideTaskbar={false} onClick={switchServer} />
      <Element label={t('taskbar.configure')} onClick={showSettings} />
      <Separator />
      <Element label={t('taskbar.close')} onClick={exit} />
    </div>
  </div>
}
