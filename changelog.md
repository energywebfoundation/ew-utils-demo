# origin release B

## general
* split up the repositories
    * ew-asset-registry-contracts
    * ew-asset-registry-lib
    * ew-asset-registry-frontend
    * ew-market-contracts
    * ew-market-lib
    * ew-origin-contracts
    * ew-origin-lib
    * ew-user-registry-contracts
    * ew-user-lib
    * ew-utils-general-contracts
    * ew-utils-general-lib  
    * ew-utils-general-precise-proofs
    * ew-utils-demo
    * ew-utils-deployment 
    * ew-utils-testbackend
    * ew-utils-testtoken 

* moved many onchain-properties to be stored offchain 
* created simple backend for testing origin

## asset-registry

    * separate repository for assets 

### smart contracts 
    * created "AssetContractLookup" Smart Contract: smart contract that stored the address of the actual logic contracts (can be used for ENS)
    * refactored code, using structs for transferring information between logic and db contract
    * updated to Solidity > 0.5.0
    * moved onchain-properties to be stored offchain: 
        * operationalSince
        * capacityWh
        * country
        * region
        * zip 
        * street
        * houseNumber
        * gpsLatitude
        * gpsLongitude
    * assets can be linked to one OriginContract, allowing him to create TradableEntities (e.g. certificates)
    * without such a link only the produced energy gets tracked, no certificates gets created
    * enforced rule that each smartMeter-address can be used once
    * assets can be retrieved by its asstetId or by its smartMeter-address (both are working)
    * each asset supports up to 10 matcher 
    * created interfaces to talk to the AssetProducingRegistryLogic and AssetConsumingRegistryLogic from outside (e.g. through origin smart contracts)
    
### asset-lib    
    * precise proofs are used for storing and retrieving the offchain properties
    * CO2 saved is not stored anymore, gets calculated instead


## market-registry

## origin-registry

## user-registry

## utils






    