export type DuelCrowdBets = {
  version: "0.1.0";
  name: "duel_crowd_bets";
  instructions: [
    {
      name: "createBet";
      accounts: [
        { name: "payer"; isMut: true; isSigner: true },
        { name: "bet"; isMut: true; isSigner: false },
        { name: "protocolTreasury"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "userA"; type: "publicKey" },
        { name: "userB"; type: "publicKey" },
        { name: "arbiter"; type: "publicKey" },
        { name: "stakeLamports"; type: "u64" },
        { name: "deadlineDuel"; type: "i64" },
        { name: "deadlineCrowd"; type: "i64" },
        { name: "resolveTs"; type: "i64" },
        { name: "spreadBps"; type: "u16" },
        { name: "creatorShareBps"; type: "u16" },
        { name: "arbiterShareBps"; type: "u16" },
        { name: "protocolShareBps"; type: "u16" }
      ];
    }
  ];
  accounts: [
    {
      name: "bet";
      type: {
        kind: "struct";
        fields: [
          { name: "userA"; type: "publicKey" },
          { name: "userB"; type: "publicKey" },
          { name: "arbiter"; type: "publicKey" },
          { name: "stakeLamports"; type: "u64" },
          { name: "userADeposited"; type: "bool" },
          { name: "userBDeposited"; type: "bool" },
          { name: "deadlineDuel"; type: "i64" },
          { name: "deadlineCrowd"; type: "i64" },
          { name: "resolveTs"; type: "i64" },
          { name: "netSupportA"; type: "u64" },
          { name: "netSupportB"; type: "u64" },
          { name: "spreadPoolCreators"; type: "u64" },
          { name: "spreadPoolArbiter"; type: "u64" },
          { name: "spreadPoolProtocol"; type: "u64" },
          { name: "spreadBps"; type: "u16" },
          { name: "creatorShareBps"; type: "u16" },
          { name: "arbiterShareBps"; type: "u16" },
          { name: "protocolShareBps"; type: "u16" },
          { name: "status"; type: { defined: "BetStatus" } },
          { name: "winnerSide"; type: { option: { defined: "Side" } } },
          { name: "protocolTreasury"; type: "publicKey" },
          { name: "bump"; type: "u8" }
        ];
      };
    },
    {
      name: "supportPosition";
      type: {
        kind: "struct";
        fields: [
          { name: "bet"; type: "publicKey" },
          { name: "bettor"; type: "publicKey" },
          { name: "side"; type: { defined: "Side" } },
          { name: "netAmount"; type: "u64" },
          { name: "claimed"; type: "bool" },
          { name: "bump"; type: "u8" }
        ];
      };
    }
  ];
  types: [
    {
      name: "BetStatus";
      type: {
        kind: "enum";
        variants: [
          { name: "Open" },
          { name: "Resolved" },
          { name: "Cancelled" }
        ];
      };
    },
    {
      name: "Side";
      type: {
        kind: "enum";
        variants: [{ name: "A" }, { name: "B" }];
      };
    }
  ];
  events: [];
  errors: [];
};
