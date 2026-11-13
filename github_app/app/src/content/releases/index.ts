import type { LocaleMap } from "../types";
import type { ChangeTranslations } from "./types";
import en from "./en";
import fr from "./fr";
import de from "./de";
import es from "./es";
import it from "./it";
import ja from "./ja";
import nl from "./nl";
import pl from "./pl";
import pt from "./pt";
import ptBR from "./pt-BR";
import ru from "./ru";
import sv from "./sv";
import tr from "./tr";
import zhCN from "./zh-CN";

export const releaseChanges = {
  en, fr, de, es, it, ja, nl, pl, pt, "pt-BR": ptBR, ru, sv, tr, "zh-CN": zhCN
} satisfies LocaleMap<ChangeTranslations>;
