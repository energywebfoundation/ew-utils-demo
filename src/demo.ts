// Copyright 2018 Energy Web Foundation
//
// This file is part of the Origin Application brought to you by the Energy Web Foundation,
// a global non-profit organization focused on accelerating blockchain technology across the energy sector, 
// incorporated in Zug, Switzerland.
//
// The Origin Application is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// This is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY and without an implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details, at <http://www.gnu.org/licenses/>.
//
// @authors: slock.it GmbH, Heiko Burkhardt, heiko.burkhardt@slock.it, Martin Kuechler, martin.kuechler@slock.it

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