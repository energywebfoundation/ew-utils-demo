/**
 * 
 * 
 */

import Web3 = require('web3');
import * as fs from 'fs';
import * as Winston from 'winston';
import { UserContractLookup, UserLogic, migrateUserRegistryContracts } from 'ew-user-registry-contracts';
import { migrateAssetRegistryContracts, AssetConsumingRegistryLogic, AssetProducingRegistryLogic } from 'ew-asset-registry-contracts';
import * as Asset from 'ew-asset-registry-lib';

const deploy: Function = async (): Promise<void> => {

    const logger: any = Winston.createLogger({
        level: 'debug',
        format: Winston.format.combine(
            Winston.format.colorize(),
            Winston.format.simple(),
        ),
        transports: [
    
            new Winston.transports.Console({ level: 'silly' })
        ]
    });

    const configFile: any = JSON.parse(fs.readFileSync(process.cwd() + '/connection-config.json', 'utf8'));
    const web3: Web3 = new Web3(configFile.develop.web3);
    const privateKeyForDeployment: string = configFile.develop.deployKey.startsWith('0x') ?
        configFile.develop.deployKey : '0x' + configFile.develop.deployKey;
    const accountForDeployment: string = web3.eth.accounts.privateKeyToAccount(privateKeyForDeployment).address;

    const userContracts: JSON  = await migrateUserRegistryContracts((web3 as any));
  
    const userContractLookupAddr: string = userContracts[
        process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserContractLookup.json'
    ];
    const userLogic: UserLogic = new UserLogic(
        (web3 as any),
        userContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserLogic.json']
    );

    await userLogic.setUser(accountForDeployment, 'admin', { privateKey: privateKeyForDeployment });
    await userLogic.setRoles(accountForDeployment, 3, { privateKey: privateKeyForDeployment });

    const deployedContracts: JSON = await migrateAssetRegistryContracts((web3 as any), userContractLookupAddr);

    console.log('### ' + deployedContracts[process.cwd() + '/node_modules/ew-asset-registry-contracts/dist/contracts/AssetContractLookup.json']);
    const assetProducingLogic: AssetProducingRegistryLogic = new AssetProducingRegistryLogic(
        (web3 as any),
        deployedContracts[process.cwd() + '/node_modules/ew-asset-registry-contracts/dist/contracts/AssetProducingRegistryLogic.json']
    );

    const assetConsumingLogic: AssetConsumingRegistryLogic = new AssetConsumingRegistryLogic(
        (web3 as any),
        deployedContracts[process.cwd() + '/node_modules/ew-asset-registry-contracts/dist/contracts/AssetConsumingRegistryLogic.json']
    );

    const assetOwnerPK: string = '0xfaab95e72c3ac39f7c060125d9eca3558758bb248d1a4cdc9c1b7fd3f91a4485';
    const assetOwnerAddress: string = web3.eth.accounts.privateKeyToAccount(assetOwnerPK).address;

    const assetSmartmeterPK: string = '0x2dc5120c26df339dbd9861a0f39a79d87e0638d30fdedc938861beac77bbd3f5';
    const assetSmartmeter: string = web3.eth.accounts.privateKeyToAccount(assetSmartmeterPK).address;

    const matcherPK: string = '0xc118b0425221384fe0cbbd093b2a81b1b65d0330810e0792c7059e518cea5383';
    const matcher: string = web3.eth.accounts.privateKeyToAccount(matcherPK).address;

    await userLogic.setUser(assetOwnerAddress, 'assetOwner', { privateKey: privateKeyForDeployment });
    await userLogic.setRoles(assetOwnerAddress, 8, { privateKey: privateKeyForDeployment });

    const conf: any = {
        blockchainProperties: {
            activeUser: {
                address: accountForDeployment, privateKey: privateKeyForDeployment,
            },
            producingAssetLogicInstance: assetProducingLogic,
            consumingAssetLogicInstance: assetConsumingLogic,
            userLogicInstance: userLogic,
            web3
        },
        offChainDataSource: {
            baseUrl: 'http://localhost:3030'
        },
        logger
    };

    const assetProps: Asset.ProducingAsset.OnChainProperties = {
        certificatesUsedForWh: 0,
        smartMeter: { address: assetSmartmeter },
        owner: { address: assetOwnerAddress },
        lastSmartMeterReadWh: 0,
        active: true,
        lastSmartMeterReadFileHash: 'lastSmartMeterReadFileHash',
        matcher: [{ address: matcher }],
        propertiesDocumentHash: null,
        url: null,
        certificatesCreatedForWh: 0,
        lastSmartMeterCO2OffsetRead: 0,
        maxOwnerChanges: 3
    };

    const assetPropsOffChain: Asset.ProducingAsset.OffChainProperties = {
        operationalSince: 0,
        capacityWh: 10,
        country: 'USA',
        region: 'AnyState',
        zip: '012345',
        city: 'Anytown',
        street: 'Main-Street',
        houseNumber: '42',
        gpsLatitude: '0.0123123',
        gpsLongitude: '31.1231',
        assetType: Asset.ProducingAsset.Type.Wind,
        complianceRegistry: Asset.ProducingAsset.Compliance.EEC,
        otherGreenAttributes: '',
        typeOfPublicSupport: ''
    };

    const asset: Asset.ProducingAsset.Entity = await Asset.ProducingAsset.createAsset(assetProps, assetPropsOffChain, conf);

    const consumingAssetProps: Asset.ConsumingAsset.OnChainProperties = {
        certificatesUsedForWh: 0,
        smartMeter: { address: assetSmartmeter },
        owner: { address: assetOwnerAddress },
        lastSmartMeterReadWh: 0,
        active: true,
        lastSmartMeterReadFileHash: 'lastSmartMeterReadFileHash',
        matcher: [{ address: matcher }],
        propertiesDocumentHash: null,
        url: null
    };

    const consumingAssetPropsOffChain: Asset.Asset.OffChainProperties = {
        operationalSince: 10,
        capacityWh: 10,
        country: 'bla',
        region: 'bla',
        zip: 'bla',
        city: 'bla',
        street: 'bla',
        houseNumber: 'bla',
        gpsLatitude: 'bla',
        gpsLongitude: 'bla'
    };

    const consumingAsset: Asset.ConsumingAsset.OnChainProperties = 
        await Asset.ConsumingAsset.createAsset(consumingAssetProps, consumingAssetPropsOffChain, conf);

};

deploy();