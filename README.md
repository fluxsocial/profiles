# Profile Expression

Here contains the holochain DNA & [ad4m](https://github.com/perspect3vism/ad4m) expression language for creating and retrieving agent profiles. Soon UI component required for displaying agent profiles will be included here and served via the ad4m language.<br> 
Data stored in the holochain DNA is expected to be an ad4m [expression](https://github.com/perspect3vism/ad4m/blob/68f3a48148391b94f929996d91dc0882a1bbf2d0/src/expression/Expression.ts#L42) with the following shape for the data field:

```
{
    signed_agent: "signed did string used for did ownership validation",
    //Profile data, JSON object of any shape
    profile: {
        ...
    },
    //RDF context field, JSON object of any shape
    @context: {
        ...
    }
}
```

Ad4m language ontology is used here to provide a known implemented interface over holochain zome functions as well as a build js bundle containing the DNA, UI and JS logic required to interface with this DNA.

No holochain validation is currently present on this DNA.
