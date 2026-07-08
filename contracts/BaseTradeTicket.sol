// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BaseTradeTicket {
    uint256 public nextTradeId = 1;

    struct TradeTicket {
        address maker;
        address taker;
        bool accepted;
        string offerText;
        string wantText;
        string note;
    }

    mapping(uint256 => TradeTicket) private tickets;

    event TradeCreated(
        uint256 indexed tradeId,
        address indexed maker,
        string offerText,
        string wantText,
        string note
    );
    event TradeResponded(uint256 indexed tradeId, address indexed taker);
    event TradeAccepted(uint256 indexed tradeId, address indexed maker, address indexed taker);

    function createTrade(
        string calldata offerText,
        string calldata wantText,
        string calldata note
    ) external returns (uint256 tradeId) {
        require(bytes(offerText).length > 0 && bytes(offerText).length <= 60, "Invalid offer");
        require(bytes(wantText).length > 0 && bytes(wantText).length <= 60, "Invalid want");
        require(bytes(note).length <= 120, "Note too long");

        tradeId = nextTradeId++;
        tickets[tradeId] = TradeTicket({
            maker: msg.sender,
            taker: address(0),
            accepted: false,
            offerText: offerText,
            wantText: wantText,
            note: note
        });

        emit TradeCreated(tradeId, msg.sender, offerText, wantText, note);
    }

    function respondToTrade(uint256 tradeId) external {
        TradeTicket storage ticket = tickets[tradeId];
        require(ticket.maker != address(0), "Trade not found");
        require(ticket.taker == address(0), "Trade already has responder");
        require(msg.sender != ticket.maker, "Maker cannot respond");

        ticket.taker = msg.sender;

        emit TradeResponded(tradeId, msg.sender);
    }

    function acceptTrade(uint256 tradeId) external {
        TradeTicket storage ticket = tickets[tradeId];
        require(ticket.maker != address(0), "Trade not found");
        require(msg.sender == ticket.maker, "Only maker can accept");
        require(ticket.taker != address(0), "No responder yet");
        require(!ticket.accepted, "Trade already accepted");

        ticket.accepted = true;

        emit TradeAccepted(tradeId, ticket.maker, ticket.taker);
    }

    function getTrade(
        uint256 tradeId
    )
        external
        view
        returns (
            address maker,
            address taker,
            bool accepted,
            string memory offerText,
            string memory wantText,
            string memory note
        )
    {
        TradeTicket storage ticket = tickets[tradeId];
        return (
            ticket.maker,
            ticket.taker,
            ticket.accepted,
            ticket.offerText,
            ticket.wantText,
            ticket.note
        );
    }
}
