// Copyright 2018 Energy Web Foundation
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
// @authors: slock.it GmbH; Heiko Burkhardt, heiko.burkhardt@slock.it; Martin Kuechler, martin.kuchler@slock.it; Chirag Parmar, chirag.parmar@slock.it

import * as fs from 'fs';
import { onboardDemo } from './onboarding';

import * as Certificate from 'ew-origin-lib';
import * as User from 'ew-user-registry-lib';
import * as Asset from 'ew-asset-registry-lib';
import * as GeneralLib from 'ew-utils-general-lib';
import {
    CertificateLogic
} from 'ew-origin-lib';

import {
    deployERC20TestToken,
    Erc20TestToken,
    TestReceiver,
    deployERC721TestReceiver
} from 'ew-erc-test-contracts';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const certificateDemo = async (
    actionString: string,
    conf: GeneralLib.Configuration.Entity,
    adminPrivateKey: string
) => {
    const action = JSON.parse(actionString);

    const adminPK = adminPrivateKey.startsWith('0x') ? adminPrivateKey : '0x' + adminPrivateKey;

    const adminAccount = conf.blockchainProperties.web3.eth.accounts.privateKeyToAccount(adminPK);

    const certificateLogic : CertificateLogic = conf.blockchainProperties.certificateLogicInstance;

    switch (action.type) {
        case 'APPROVE_CERTIFICATION_REQUEST':
            console.log('-----------------------------------------------------------');

            try {
                await certificateLogic.approveCertificationRequest(action.data.certificationRequestIndex, {
                    privateKey: action.data.issuerPK
                });

                conf.logger.info(`Certification request #${action.data.certificationRequestIndex} approved`);
            } catch (e) {
                conf.logger.error(`Could not approve certification request #${action.data.certificationRequestIndex}\n`, e);
            }

            console.log('-----------------------------------------------------------\n');
            break;
        case 'SAVE_SMARTMETER_READ_PRODUCING':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: action.data.smartMeter,
                privateKey: action.data.smartMeterPK
            };

            try {
                let asset = await new Asset.ProducingAsset.Entity(action.data.assetId, conf).sync();
                await asset.saveSmartMeterRead(action.data.meterreading, action.data.filehash, action.data.timestamp || 0, action.data.supplyId,
                    action.data.averagePower,
                    action.data.powerProfileURL,
                    action.data.powerProfileHash
                );
                asset = await asset.sync();
                conf.logger.verbose('Producing smart meter reading saved');
            } catch (e) {
                conf.logger.error('Could not save smart meter reading for producing asset\n' + e);
            }

            console.log('-----------------------------------------------------------\n');

            break;
        case 'SAVE_SMARTMETER_READ_CONSUMING':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: action.data.smartMeter,
                privateKey: action.data.smartMeterPK
            };

            try {
                let asset = await new Asset.ConsumingAsset.Entity(action.data.assetId, conf).sync();
                await asset.saveSmartMeterRead(action.data.meterreading, action.data.filehash, action.data.timestamp || 0);
                asset = await asset.sync();
                conf.logger.verbose('Consuming meter reading saved');
            } catch (e) {
                conf.logger.error('Could not save smart meter reading for consuming asset\n' + e);
            }

            console.log('-----------------------------------------------------------\n');

            break;

        case 'SET_MARKET_CONTRACT':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: adminAccount.address,
                privateKey: adminPK
            };

            const contractConfig = JSON.parse(
                fs.readFileSync('./config/contractConfig.json', 'utf8').toString()
            );

            try {
                await conf.blockchainProperties.producingAssetLogicInstance.setMarketLookupContract(
                    action.data.assetId,
                    contractConfig.originContractLookup,
                    { privateKey: adminPK }
                );

                await conf.blockchainProperties.producingAssetLogicInstance.setRealMarketLookupContract(
                    action.data.assetId,
                    contractConfig.marketContractLookup,
                    { privateKey: adminPK }
                );

                await conf.blockchainProperties.certificateLogicInstance.setMarketLogicContract(
                    contractConfig.marketLogic,
                    { privateKey: adminPK }
                );

                conf.logger.info('Certificates for Asset #' + action.data.assetId + ' initialized');
            } catch (e) {
                conf.logger.error('Could not intialize certificates\n' + e);
            }
            console.log('-----------------------------------------------------------');
            break;

        case 'SET_TOKEN_PROPS':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: adminAccount.address,
                privateKey: adminPK
            };

            let TOKEN_ADDRESS = action.data.tokenAddress;
            let tokenHolder = action.data.tokenHolder;
            let TOKEN_RECEIVER = action.data.tokenReceiver;

            let erc20TestTokenInstance = new Erc20TestToken(
                conf.blockchainProperties.web3,
                TOKEN_ADDRESS
            );

            try {
                if (!TOKEN_ADDRESS) {
                    const ALL_TOKENS = (100000 * 10**18).toLocaleString('fullwide', {useGrouping:false}) as any;

                    TOKEN_ADDRESS = (await deployERC20TestToken(
                        conf.blockchainProperties.web3,
                        tokenHolder,
                        ALL_TOKENS,
                        adminPK
                    )).contractAddress;     
                    console.log(`Deployed token: ${TOKEN_ADDRESS}`);

                    const testPrivateKey = tokenHolder === '0x7672fa3f8c04abbcbad14d896aad8bedece72d2b' ?
                    '0x50397ee7580b44c966c3975f561efb7b58a54febedaa68a5dc482e52fb696ae7' : '';

                    console.log('testPrivateKey', testPrivateKey);

                    conf.blockchainProperties.activeUser = {
                        address: tokenHolder,
                        privateKey: testPrivateKey
                    };

                    erc20TestTokenInstance = new Erc20TestToken(
                        conf.blockchainProperties.web3,
                        TOKEN_ADDRESS
                    );

                    const certificateLogicAddress = conf.blockchainProperties.certificateLogicInstance.web3Contract._address;

                    console.log('Certificate Logic Address: ', certificateLogicAddress);

                    console.log(`token.approve(${certificateLogicAddress}, ${ALL_TOKENS})`);

                    await erc20TestTokenInstance.approve(certificateLogicAddress, ALL_TOKENS, {
                        privateKey: testPrivateKey
                    });

                    const allowance = await erc20TestTokenInstance.allowance(tokenHolder, certificateLogicAddress);

                    console.log(`token.allowance(${tokenHolder}, ${certificateLogicAddress}) = ${allowance}`);
                }

                conf.blockchainProperties.activeUser = {
                    address: adminAccount.address,
                    privateKey: adminPK
                };    
                
                try {
                    console.log(`TOKEN HOLDER has: ${await erc20TestTokenInstance.balanceOf(tokenHolder)} tokens`);
                } catch (error) {
                    console.log(`Seems Token is not deployed on this chain.`);
                }

                await conf.blockchainProperties.certificateLogicInstance.setTokenProps(
                    TOKEN_ADDRESS,
                    tokenHolder,
                    TOKEN_RECEIVER,
                    { privateKey: adminPK }
                );

                conf.logger.info('Token props set');
            } catch (e) {
                conf.logger.error('Could not set token props\n' + e);
            }
            console.log('-----------------------------------------------------------');
            break;

        case 'TRANSFER_CERTIFICATE':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: action.data.assetOwner,
                privateKey: action.data.assetOwnerPK
            };

            try {
                conf.logger.verbose(
                    'Asset Owner Balance(BEFORE): ' +
                        (await Certificate.TradableEntity.getBalance(action.data.assetOwner, conf))
                );
                conf.logger.verbose(
                    'Asset Owner Balance(BEFORE): ' +
                        (await Certificate.TradableEntity.getBalance(action.data.addressTo, conf))
                );
                const certificate = await new Certificate.Certificate.Entity(
                    action.data.certId,
                    conf
                ).sync();
                await certificate.transferFrom(action.data.addressTo);
                conf.logger.info('Certificate Transferred');
                conf.logger.verbose(
                    'Asset Owner Balance(AFTER): ' +
                        (await Certificate.TradableEntity.getBalance(action.data.assetOwner, conf))
                );
                conf.logger.verbose(
                    'Asset Owner Balance(AFTER): ' +
                        (await Certificate.TradableEntity.getBalance(action.data.addressTo, conf))
                );
            } catch (e) {
                conf.logger.error('Could not transfer certificates\n' + e);
            }

            console.log('-----------------------------------------------------------\n');
            break;

        case 'SPLIT_CERTIFICATE':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: action.data.assetOwner,
                privateKey: action.data.assetOwnerPK
            };

            try {
                let certificate = await new Certificate.Certificate.Entity(
                    action.data.certId,
                    conf
                ).sync();
                await certificate.splitCertificate(action.data.splitValue);
                certificate = await certificate.sync();

                conf.logger.info('Certificate Split into:', certificate.children);

                for (const cId of certificate.children) {
                    const c = await new Certificate.Certificate.Entity(cId.toString(), conf).sync();
                    conf.logger.info('Child Certificate #' + cId + ' - PowerInW: ' + c.powerInW);
                }
            } catch (e) {
                conf.logger.error('Could not split certificates\n' + e);
            }

            console.log('-----------------------------------------------------------\n');
            break;

        case 'SET_ERC20_CERTIFICATE':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: action.data.assetOwner,
                privateKey: action.data.assetOwnerPK
            };

            try {
                let certificate = await new Certificate.Certificate.Entity(
                    action.data.certId,
                    conf
                ).sync();

                await certificate.setOnChainDirectPurchasePrice(action.data.price);
                certificate = await certificate.sync();

                const erc20TestAddress = (await deployERC20TestToken(
                    conf.blockchainProperties.web3,
                    action.data.testAccount,
                    100000000,
                    adminPK
                )).contractAddress;

                const erc20TestToken = new Erc20TestToken(
                    conf.blockchainProperties.web3,
                    erc20TestAddress
                );
                await certificate.setTradableToken(erc20TestAddress);
                certificate = await certificate.sync();
                conf.logger.info('Demo ERC token created: ' + erc20TestAddress);

                // save in global storage
                const erc20Config = {} as any;
                erc20Config.ERC20Address = erc20TestAddress;

                const writeJsonFile = require('write-json-file');
                await writeJsonFile('./config/erc20Config.json', erc20Config);
            } catch (e) {
                conf.logger.error('Could not set ERC20 tokens for certificate trading\n', e);
            }

            console.log('-----------------------------------------------------------\n');

            break;
        case 'PUBLISH_CERTIFICATE_FOR_SALE':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: action.data.certificateOwner,
                privateKey: action.data.certificateOwnerPK
            };

            const erc20 = JSON.parse(
                fs.readFileSync('./config/erc20Config.json', 'utf8').toString()
            );

            try {
                let certificate = await new Certificate.Certificate.Entity(
                    action.data.certId,
                    conf
                ).sync();

                await certificate.publishForSale(action.data.price, erc20.ERC20Address);
                certificate = await certificate.sync();

                conf.logger.info(`Certificate ${action.data.certId} published for sale`);
            } catch (e) {
                conf.logger.error(`Could not set publish ${action.data.certId} for sale\n`, e);
            }

            console.log('-----------------------------------------------------------\n');
            break;
        case 'PUBLISH_CERTIFICATE_FOR_SALE_OFFCHAIN':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: action.data.certificateOwner,
                privateKey: action.data.certificateOwnerPK
            };
            try {
                let certificate = await new Certificate.Certificate.Entity(
                    action.data.certId,
                    conf
                ).sync();

                let currency;

                switch (action.data.currency) {
                    case 'EUR':
                        currency = GeneralLib.Currency.EUR;
                        break;
                    case 'USD':
                        currency = GeneralLib.Currency.USD;
                        break;
                    case 'SGD':
                        currency = GeneralLib.Currency.SGD;
                        break;
                    case 'THB':
                        currency = GeneralLib.Currency.THB;
                        break;
                }

                await certificate.setOffChainSettlementOptions({
                    price: action.data.price,
                    currency
                });
                await certificate.publishForSale(action.data.price, '0x0000000000000000000000000000000000000000');
                certificate = await certificate.sync();

                conf.logger.info(`Certificate ${action.data.certId} published for sale`);
            } catch (e) {
                conf.logger.error(`Could not set publish ${action.data.certId} for sale\n`, e);
            }

            console.log('-----------------------------------------------------------\n');
            break;
        case 'REQUEST_CERTIFICATES':
                console.log('-----------------------------------------------------------');

                const assetId = Number(action.data.assetId);
    
                try {
                    await certificateLogic.requestCertificates(assetId, action.data.lastRequestedSMRead, {
                        privateKey: action.data.assetOwnerPK
                    });
    
                    conf.logger.info(`Requested certificates for asset ${assetId} up to SM read ${action.data.lastRequestedSMRead}`);
                } catch (e) {
                    conf.logger.error(`Could not request certificates for asset ${assetId} up to SM read ${action.data.lastRequestedSMRead}\n`, e);
                }
    
                console.log('-----------------------------------------------------------\n');
                break;
        case 'UNPUBLISH_CERTIFICATE_FROM_SALE':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: action.data.certificateOwner,
                privateKey: action.data.certificateOwnerPK
            };

            try {
                let certificate = await new Certificate.Certificate.Entity(
                    action.data.certId,
                    conf
                ).sync();

                await certificate.unpublishForSale();
                certificate = await certificate.sync();

                conf.logger.info(`Certificate ${action.data.certId} unpublished from sale`);
            } catch (e) {
                conf.logger.error(`Could not set unpublish ${action.data.certId} from sale\n`, e);
            }

            console.log('-----------------------------------------------------------\n');
            break;
        case 'BUY_CERTIFICATE':
            console.log('-----------------------------------------------------------');

            conf.blockchainProperties.activeUser = {
                address: action.data.buyer,
                privateKey: action.data.buyerPK
            };

            const erc20conf = JSON.parse(
                fs.readFileSync('./config/erc20Config.json', 'utf8').toString()
            );

            const erc20TestToken = new Erc20TestToken(
                conf.blockchainProperties.web3,
                erc20conf.ERC20Address
            );
            await erc20TestToken.approve(action.data.assetOwner, action.data.price, {
                privateKey: action.data.buyerPK
            });
            conf.logger.verbose(
                'Allowance: ' +
                    (await erc20TestToken.allowance(action.data.buyer, action.data.assetOwner))
            );

            try {
                conf.logger.verbose(
                    'Buyer Balance(BEFORE): ' +
                        (await Certificate.TradableEntity.getBalance(action.data.buyer, conf))
                );
                const certificate = await new Certificate.Certificate.Entity(
                    action.data.certId,
                    conf
                ).sync();
                await certificate.buyCertificate();
                conf.logger.info('Certificate Bought');
                conf.logger.verbose(
                    'Buyer Balance(AFTER): ' +
                        (await Certificate.TradableEntity.getBalance(action.data.buyer, conf))
                );
            } catch (e) {
                conf.logger.error('Could not buy Certificates\n' + e);
            }

            console.log('-----------------------------------------------------------\n');
            break;

        default:
            const passString = JSON.stringify(action);
            await onboardDemo(passString, conf, adminPK);
    }
};
