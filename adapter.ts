import type { Address, Expression, ExpressionAdapter, PublicSharing, LanguageContext, HolochainLanguageDelegate, AgentService, IPFSNode } from "@perspect3vism/ad4m";
import { profile } from "console";
import { DNA_NICK } from "./dna";

const _appendBuffer = (buffer1, buffer2) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
  return chunks.reduce(_appendBuffer);
};

class ProfilePutAdapter implements PublicSharing {
  #agent: AgentService;
  #IPFS: IPFSNode;
  #DNA: HolochainLanguageDelegate;

  constructor(context: LanguageContext) {
    this.#agent = context.agent;
    this.#IPFS = context.IPFS;
    this.#DNA = context.Holochain as HolochainLanguageDelegate;
  }

  async createPublic(profileData: object): Promise<Address> {
    const orderedProfileData = Object.keys(profileData)
      .sort()
      .reduce((obj, key) => {
        obj[key] = profileData[key];
        return obj;
      }, {});
    const expression = this.#agent.createSignedExpression(orderedProfileData);
    console.log("work")

    //@ts-ignore
    if (expression.data.profile['schema:image']) {
      expression.data.profile['schema:image'] = JSON.parse(expression.data.profile['schema:image']);
      //Take the image and upload into IPFS and replace with IPFS address
      //@ts-ignore
      if (expression.data.profile['schema:image']["schema:contentUrl"]) {
        //@ts-ignore
        const ipfsAddress = await this.#IPFS.add({content: expression.data.profile['schema:image']["schema:contentUrl"]});
        //@ts-ignore
        const ipfsHash = ipfsAddress.cid.toString();
        //@ts-ignore
        expression.data.profile['schema:image']["schema:contentUrl"] = ipfsHash;
      }
      //Take the thumbnail and upload into IPFS and replace content with IPFS address
      //@ts-ignore
      if (expression.data.profile['schema:image']['schema:thumbnail']["schema:contentUrl"]) {
        //@ts-ignore
        const ipfsAddress = await this.#IPFS.add({content: expression.data.profile['schema:image']['schema:thumbnail']["schema:contentUrl"]});
        //@ts-ignore
        const ipfsHash = ipfsAddress.cid.toString();
        //@ts-ignore
        expression.data.profile['schema:image']['schema:thumbnail']["schema:contentUrl"] = ipfsHash; 
      }
      expression.data.profile['schema:image'] = JSON.stringify(expression.data.profile['schema:image'])
    }
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
  #IPFS: IPFSNode;

  putAdapter: PublicSharing;

  constructor(context: LanguageContext) {
    this.#DNA = context.Holochain as HolochainLanguageDelegate;
    this.#IPFS = context.IPFS;
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

      if (cloneRes.data.profile['schema:image']) {
        cloneRes.data.profile['schema:image'] = JSON.parse(cloneRes.data.profile['schema:image']);
        if (cloneRes.data.profile['schema:image']["schema:contentUrl"]) {
          const chunks = [];
          // @ts-ignore
          for await (const chunk of this.#IPFS.cat(cloneRes.data.profile['schema:image']["schema:contentUrl"])) {
            chunks.push(chunk);
          }
          
          const fileString = Buffer.from(uint8ArrayConcat(chunks)).toString();
          cloneRes.data.profile['schema:image']["schema:contentUrl"] = fileString;
        }
  
        if (cloneRes.data.profile['schema:image']['schema:thumbnail']["schema:contentUrl"]) {
          const chunks = [];
          // @ts-ignore
          for await (const chunk of this.#IPFS.cat(cloneRes.data.profile['schema:image']['schema:thumbnail']["schema:contentUrl"])) {
            chunks.push(chunk);
          }
      
          const fileString = Buffer.from(uint8ArrayConcat(chunks)).toString();
          cloneRes.data.profile['schema:image']['schema:thumbnail']["schema:contentUrl"] = fileString;
        }
        cloneRes.data.profile['schema:image'] = JSON.stringify(cloneRes.data.profile['schema:image']);
      }
      console.log("resulting", cloneRes);

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
