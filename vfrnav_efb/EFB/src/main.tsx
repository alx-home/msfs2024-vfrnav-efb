
/**
 * App definition to be injected into EFB
 */

import { Efb } from "@alx-home/efb-api";
import { VfrNavApp } from "./App";

// eslint-disable-next-line react-hooks/rules-of-hooks
Efb.use(VfrNavApp);