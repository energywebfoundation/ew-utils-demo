/**
 * 
 * 
 */
import Web3 = require('web3');
import * as fs from 'fs';
import * as Winston from 'winston';
import { UserContractLookup, UserLogic, migrateUserRegistryContracts } from 'ew-user-registry-contracts';
import { migrateAssetRegistryContracts, AssetConsumingRegistryLogic, AssetProducingRegistryLogic } from 'ew-asset-registry-contracts';

export const init: () => Promise<any> = async (): Promise<any> => {
    const logger: any = Winston.createLogger({
        level: 'debug',
        format: Winston.format.combine(
            Winston.format.colorize(),
            Winston.format.simple()
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

    const assetLookuptContract: string = 
        deployedContracts[process.cwd() + '/node_modules/ew-asset-registry-contracts/dist/contracts/AssetContractLookup.json'];

    logger.info('AssetLookupContract address: ' + assetLookuptContract);
    const assetProducingLogic: AssetProducingRegistryLogic = new AssetProducingRegistryLogic(
        (web3 as any),
        deployedContracts[process.cwd() + '/node_modules/ew-asset-registry-contracts/dist/contracts/AssetProducingRegistryLogic.json']
    );

    const assetConsumingLogic: AssetConsumingRegistryLogic = new AssetConsumingRegistryLogic(
        (web3 as any),
        deployedContracts[process.cwd() + '/node_modules/ew-asset-registry-contracts/dist/contracts/AssetConsumingRegistryLogic.json']
    );

    const assetOwnerPK: string = configFile.develop.assetOwnerPK.startsWith('0x') ?
        configFile.develop.assetOwnerPK : '0x' + configFile.develop.assetOwnerPK;
    const assetOwnerAddress: string = web3.eth.accounts.privateKeyToAccount(assetOwnerPK).address; 

    const assetSmartmeterPK: string = configFile.develop.assetSmartmeterPK.startsWith('0x') ?
        configFile.develop.assetSmartmeterPK : '0x' + configFile.develop.assetSmartmeterPK;
    const assetSmartmeter: string = web3.eth.accounts.privateKeyToAccount(assetSmartmeterPK).address;

    const matcherPK: string = configFile.develop.matcherPK.startsWith('0x') ?
        configFile.develop.matcherPK : '0x' + configFile.develop.matcherPK;
    const matcher: string = web3.eth.accounts.privateKeyToAccount(matcherPK).address;

    web3.eth.accounts.wallet.add('0xfaab95e72c3ac39f7c060125d9eca3558758bb248d1a4cdc9c1b7fd3f91a4485');
    web3.eth.accounts.wallet.add('0x2dc5120c26df339dbd9861a0f39a79d87e0638d30fdedc938861beac77bbd3f5');
    web3.eth.accounts.wallet.add('0xc118b0425221384fe0cbbd093b2a81b1b65d0330810e0792c7059e518cea5383');
    web3.eth.accounts.wallet.add(privateKeyForDeployment);

    await userLogic.setUser(assetOwnerAddress, 'assetOwner', { privateKey: privateKeyForDeployment });
    await userLogic.setRoles(assetOwnerAddress, 8, { privateKey: privateKeyForDeployment });

    return {
        conf: {
            blockchainProperties: {
                activeUser: {
                    address: accountForDeployment, privateKey: privateKeyForDeployment
                },
                producingAssetLogicInstance: assetProducingLogic.web3Contract,
                consumingAssetLogicInstance: assetConsumingLogic.web3Contract,
                userLogicInstance: userLogic.web3Contract,
                web3
            },
            offChainDataSource: {
                baseUrl: configFile.develop.offChainDataSourceBaseUrl
            },
            logger
        },
        assetOwnerAddress: assetOwnerAddress,
        assetSmartmeter: assetSmartmeter,
        matcher: matcher

    };

};