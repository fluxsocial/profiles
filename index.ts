import type Address from "@perspect3vism/ad4m/Address";
import type Agent from "@perspect3vism/ad4m/Agent";
import type Language from "@perspect3vism/ad4m/Language";
import type LanguageContext from "@perspect3vism/ad4m-language-context/LanguageContext";
import type { Interaction } from "@perspect3vism/ad4m/Language";
import ProfileAdapter from "./adapter";
import ProfileAuthorAdapter from "./authorAdapter";
import Icon from "./build/Icon.js";
import ConstructorIcon from "./build/ConstructorIcon.js";
import { ProfileExpressionUI } from "./profileExpressionUI";
import { DNA, DNA_NICK } from "./dna";
import type HolochainLanguageDelegate from "@perspect3vism/ad4m-language-context/Holochain/HolochainLanguageDelegate";

function iconFor(expression: Address): string {
  return Icon;
}

function constructorIcon(): string {
  return ConstructorIcon;
}

function interactions(a: Agent, expression: Address): Interaction[] {
  return [];
}

export const name = "agent-profiles";

export default async function create(context: LanguageContext): Promise<Language> {
  const Holochain = context.Holochain as HolochainLanguageDelegate;
  await Holochain.registerDNAs([{ file: DNA, nick: DNA_NICK }]);

  const expressionAdapter = new ProfileAdapter(context);
  const authorAdaptor = new ProfileAuthorAdapter(context);
  const expressionUI = new ProfileExpressionUI();

  return {
    name,
    expressionAdapter,
    authorAdaptor,
    iconFor,
    constructorIcon,
    interactions,
    expressionUI,
  } as Language;
}
