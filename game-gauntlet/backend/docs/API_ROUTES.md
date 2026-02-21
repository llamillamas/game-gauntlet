# API Routes — Game Gauntlet

**Status:** Routes implemented with DB stubs

## Endpoints Implemented

### Events
- ✅ `GET /api/events/:eventId` - Fetch event details by ID
- ✅ `POST /api/events` - Create a new event
- ✅ `POST /api/events/:eventId/settle` - Settle an event with winner

### Bets
- ✅ `GET /api/bets/:betId` - Fetch bet details by ID
- ✅ `POST /api/bets` - Create a new betting pool
- ✅ `POST /api/bets/:betId/place` - Place a bet in a pool

### Wallets
- ✅ `GET /api/wallets/:address` - Fetch wallet details by address
- ✅ `POST /api/wallets/:address/connect` - Connect a wallet (create/update)

## Implementation Status

### Database Integration
- ✅ **READY** - All routes connect to PostgreSQL using pg Pool
- Tables required: `events`, `bets`, `wallets`, `bet_entries`, `games`, `parties`
- Connection string: `process.env.DATABASE_URL`

### Solana Smart Contracts Integration
- ⏳ **PENDING** - Waiting for DEPLOY phase
- TODO sections marked in code with contract program IDs needed:
  - `GAME_REGISTRY_PROGRAM_ID` - Event creation on-chain
  - `BETTING_POOL_PROGRAM_ID` - Betting pool creation on-chain
  - `RESULTS_SETTLEMENT_PROGRAM_ID` - Event settlement on-chain
  - `USDC_MINT` - Token transfers

## Next Steps

Once the Contracts Agent provides the deployed program IDs:

1. Add environment variables to `.env`:
   ```
   GAME_REGISTRY_PROGRAM_ID=<deployed_id>
   BETTING_POOL_PROGRAM_ID=<deployed_id>
   RESULTS_SETTLEMENT_PROGRAM_ID=<deployed_id>
   USDC_MINT=<token_mint>
   ```

2. Uncomment TODO sections in:
   - `/routes/events.js` - Event creation & settlement
   - `/routes/bets.js` - Betting pool & USDC transfers

3. Implement `solanaClient` module for on-chain interactions

## Architecture Notes

- All routes validate input before database operations
- Error handling includes 404s for missing resources and 400s for invalid input
- UUIDs generated server-side using `uuid` package
- JSON responses for all endpoints
- CORS enabled for cross-origin requests
- Environment variable validation required for DATABASE_URL

## Error Responses

- `400` - Missing required fields or invalid input
- `404` - Resource not found
- `500` - Server/database error

## Testing

Once deployed, verify with curl:

```bash
# Create event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"game_id": "game-1", "organizer_wallet": "wallet-abc...", "entry_fee": 10, "max_participants": 100}'

# Get wallet
curl http://localhost:3000/api/wallets/wallet-abc...

# Connect wallet
curl -X POST http://localhost:3000/api/wallets/wallet-abc.../connect
```
