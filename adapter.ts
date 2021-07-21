import type { Address, Expression, ExpressionAdapter, PublicSharing, LanguageContext, HolochainLanguageDelegate, AgentService } from "@perspect3vism/ad4m";
import { DNA_NICK } from "./dna";

class ProfilePutAdapter implements PublicSharing {
  #agent: AgentService;
  #DNA: HolochainLanguageDelegate;

  constructor(context: LanguageContext) {
    this.#agent = context.agent;
    this.#DNA = context.Holochain as HolochainLanguageDelegate;
  }

  async createPublic(shortForm: object): Promise<Address> {
    const orderedShortFormData = Object.keys(shortForm)
      .sort()
      .reduce((obj, key) => {
        obj[key] = shortForm[key];
        return obj;
      }, {});
    const expression = this.#agent.createSignedExpression(orderedShortFormData);
    console.log("Posting expression", expression);
    const res = await this.#DNA.call(
      DNA_NICK,
      "did-profiles",
      "create_profile",
      expression
    );
    return expression.author;
  }
}

export default class ProfileAdapter implements ExpressionAdapter {
  #DNA: HolochainLanguageDelegate;

  putAdapter: PublicSharing;

  constructor(context: LanguageContext) {
    this.#DNA = context.Holochain as HolochainLanguageDelegate;
    this.putAdapter = new ProfilePutAdapter(context);
  }

  async get(address: Address): Promise<Expression> {
    console.log("Getting expression with address", address);
    const expression = await this.#DNA.call(
      DNA_NICK,
      "did-profiles",
      "get_profile",
      address
    );
    if (expression != null) {
      var cloneRes = Object.assign({}, expression);
      delete cloneRes.proof;
      delete cloneRes.timestamp;
      let ad4mExpression: Expression = {
        author: address,
        proof: expression.proof,
        timestamp: expression.timestamp,
        data: cloneRes.data
      }
      return ad4mExpression
    } else {
      return null;
    }
  }
}
