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
import { init } from './init';

const deploy: Function = async (): Promise<void> => {

    const initData: any = await init();

    const assetProps: Asset.ProducingAsset.OnChainProperties = {
        certificatesUsedForWh: 0,
        smartMeter: { address: initData.assetSmartmeter },
        owner: { address: initData.assetOwnerAddress },
        lastSmartMeterReadWh: 0,
        active: true,
        lastSmartMeterReadFileHash: 'lastSmartMeterReadFileHash',
        matcher: [{ address: initData.matcher }],
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
        gpsLatitude: '5.0',
        gpsLongitude: '13.0',
        assetType: Asset.ProducingAsset.Type.Wind,
        complianceRegistry: Asset.ProducingAsset.Compliance.EEC,
        otherGreenAttributes: '',
        typeOfPublicSupport: ''
    };

    const asset: Asset.ProducingAsset.Entity = await Asset.ProducingAsset.createAsset(assetProps, assetPropsOffChain, initData.conf);

    const consumingAssetProps: Asset.ConsumingAsset.OnChainProperties = {
        certificatesUsedForWh: 0,
        smartMeter: { address: initData.assetSmartmeter },
        owner: { address: initData.assetOwnerAddress },
        lastSmartMeterReadWh: 0,
        active: true,
        lastSmartMeterReadFileHash: 'lastSmartMeterReadFileHash',
        matcher: [{ address: initData.matcher }],
        propertiesDocumentHash: null,
        url: null
    };

    const consumingAssetPropsOffChain: Asset.Asset.OffChainProperties = {
        operationalSince: 10,
        capacityWh: 10,
        country: 'USA',
        region: 'Texas',
        zip: '1234',
        city: 'Dallas',
        street: 'Evergreen Terrace',
        houseNumber: '11',
        gpsLatitude: '13.0 ',
        gpsLongitude: '11.0'
    };

    const consumingAsset: Asset.ConsumingAsset.OnChainProperties = 
        await Asset.ConsumingAsset.createAsset(consumingAssetProps, consumingAssetPropsOffChain, initData.conf);

};

deploy();