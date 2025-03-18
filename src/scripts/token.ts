import {
  Collection,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionDataArgs,
  Creator,
  Uses,
  createMetadataAccountV3,
} from "@metaplex-foundation/mpl-token-metadata";
import { none } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  Connection,
  Keypair,
  clusterApiUrl,
  Transaction,
  PublicKey,
  SystemProgram
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
import { toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';
import { config } from "../config";

export interface Metadata {
  name: string;
  symbol: string;
  uri: string;
}

// СОЗДАЁТ АККАУНТ ДЛЯ КОЙНА И КУДА ТАК СКАЗАТЬ ЗАГРУЖЕН КОНТРАКТ
async function buildCreateTokenTransaction(
  connection: Connection,
  payer: web3.PublicKey,
  minter: Keypair,
  decimals: number,
  transaction: web3.Transaction
) {
  // ОТПРАВКА СТАРТОВЫХ ТОКЕНОВ ДЛЯ СОЗДАНИЯ АККАУНТА
  const lamports = await token.getMinimumBalanceForRentExemptMint(connection);

  // УСТАНОВКА ID ПРОГРАММЫ К КАКОЙ ОТСНОСИТЬСЯ АККАУНТ
  const programId = TOKEN_PROGRAM_ID;

  // СОЗДАНИЕ АККАУНТА ДЛЯ ТОКЕНА
  var accountKeypair = web3.Keypair.generate();

  if (minter) {
    accountKeypair = minter;
  }

  transaction.add(
    web3.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: accountKeypair.publicKey,
      lamports,
      space: token.MINT_SIZE,
      programId,
    }),

    token.createInitializeMintInstruction(
      accountKeypair.publicKey,
      decimals,
      payer,
      payer,
      programId
    )
  );
}

// СВЯЗЫВАЕТ АККАУНТ-ХРАНИЛИЩЕ С ТОКЕНОМ ДЛЯ ХРАНЕНИЯ БАЛАНСОВ
async function buildCreateAssociatedTokenAccountTransaction(
  payer: web3.PublicKey,
  mint: web3.PublicKey,
  associatedTokenAddress: web3.PublicKey,
  transaction: web3.Transaction
) {
  if (!associatedTokenAddress) {
    associatedTokenAddress = await token.getAssociatedTokenAddress(
      mint,
      payer,
      false
    );
  }

  transaction.add(
    token.createAssociatedTokenAccountInstruction(
      payer,
      associatedTokenAddress,
      payer,
      mint
    )
  );
}

// МИНТИТ ТОКЕНЫ
async function buildCreateMintTransaction(
  payer: web3.PublicKey,
  mint: web3.PublicKey,
  associatedTokenAddress: web3.PublicKey,
  supply: number,
  decimals: number,
  transaction: web3.Transaction
) {
  // СОЗДАНИЕ ТРАНЗАКЦИИ

  const bigSupply = BigInt(supply) * BigInt(10) ** BigInt(decimals);

  console.log("Try mint a lot of tokens:", bigSupply);

  transaction.add(
    token.createMintToInstruction(
      mint,
      associatedTokenAddress,
      payer,
      bigSupply
    )
  );
}

// Убираем возможность минтить ещё токенов
async function buildRevokeMintTransaction(
  payer: web3.PublicKey,
  mint: web3.PublicKey,
  transactions: Transaction
) {
  // СОЗДАНИЕ ТРАНЗАКЦИИ

  transactions.add(
    token.createSetAuthorityInstruction(
      mint,
      payer,
      token.AuthorityType.MintTokens,
      null
    )
  );
}

// Убираем возможность замораживать токены
async function buildRevokeFreezeTransaction(
  payer: web3.PublicKey,
  mint: web3.PublicKey,
  transaction: web3.Transaction
) {
  // СОЗДАНИЕ ТРАНЗАКЦИИ

  transaction.add(
    token.createSetAuthorityInstruction(
      mint,
      payer,
      token.AuthorityType.FreezeAccount,
      null
    )
  );
}

// Моя комиссия
async function buildMintComission(
  payer: web3.PublicKey,
  transaction: web3.Transaction
) {
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(config.feeReceiver),
      lamports: config.comissionAmount, // Указываем сумму в лампортах
    })
  );
}

// ДОБАВЛЯЕТ МЕТАДАННЫЕ В ТОКЕН
async function addMetaData(
  connection: any,
  walletContext: any,
  minter: any,
  metadata: Metadata,
  transactions: Transaction
) {
  let _rpcEndpoint = connection._rpcEndpoint || clusterApiUrl("testnet");

  const umi = createUmi(_rpcEndpoint)
    .use(walletAdapterIdentity(walletContext))
    .use(mplTokenMetadata());

  const onChainData = {
    ...metadata,
    // we don't need that
    sellerFeeBasisPoints: 0,
    creators: none<Creator[]>(),
    collection: none<Collection>(),
    uses: none<Uses>(),
  };

  let mintAuthority = walletContext.publicKey;
  let updateAuthority = walletContext.publicKey;

  console.log("Mint authority: ", mintAuthority);

  const accounts: CreateMetadataAccountV3InstructionAccounts = {
    mint: minter,
    mintAuthority: mintAuthority,
    updateAuthority: updateAuthority,
    payer: umi.payer,
  };

  const data: CreateMetadataAccountV3InstructionDataArgs = {
    isMutable: false,
    collectionDetails: null,
    data: onChainData,
  };

  const instructionMetaData = await createMetadataAccountV3(umi, {
    ...accounts,
    ...data,
  }).getInstructions()

  transactions.add(toWeb3JsInstruction(instructionMetaData[0]));
}

export async function createSPLTokenWithMetadata(
  connectionContext: Connection,
  walletContext: any, // Phantom Wallet
  supply: number,
  decimals: number,
  metadata: Metadata,
  revokeMintAuthority: boolean = false,
  revokeFreezeAuthority: boolean = false
): Promise<string> {
  if (!walletContext.publicKey || !walletContext.signTransaction) {
    throw new Error(
      "❌ Кошелёк не подключен или не поддерживает подпись транзакций."
    );
  }

  try {
    const connection = connectionContext;

    // 1. Создаём токен с поддержкой SPL

    // СОЗДАНИЕ АККАУНТА ДЛЯ ТОКЕНА
    var minter = web3.Keypair.generate();

    var transactions = new Transaction({
      feePayer: walletContext.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    });

    await buildCreateTokenTransaction(
      connection,
      walletContext.publicKey,
      minter,
      decimals,
      transactions
    );

    // /// /// /// // /// / // / / / / // / / / / // /

    // 2. Получаем Associated Token Accounts

    let associatedTokenAddress = await token.getAssociatedTokenAddress(
      minter.publicKey,
      walletContext.publicKey,
      false
    );

    await buildCreateAssociatedTokenAccountTransaction(
      walletContext.publicKey,
      minter.publicKey,
      associatedTokenAddress,
      transactions
    );

    // /// /// /// // /// / // / / / / // / / / / // /
    
    await buildCreateMintTransaction(
      walletContext.publicKey,
      minter.publicKey,
      associatedTokenAddress,
      supply,
      decimals,
      transactions
    );

    await addMetaData(connection, walletContext, minter.publicKey, metadata, transactions);

    if (revokeFreezeAuthority) {
      await buildRevokeFreezeTransaction(
        walletContext.publicKey,
        minter.publicKey,
        transactions
      );
    }

    if (revokeMintAuthority) {
      await buildRevokeMintTransaction(
        walletContext.publicKey,
        minter.publicKey,
        transactions
      );
    }

    await buildMintComission(walletContext.publicKey, transactions);

    transactions.sign(minter);

    let signature = await walletContext.sendTransaction(
      transactions,
      connection
    );

    const latestBlockHash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      signature,
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    });

    console.log(`✅ Токены сминчены в аккаунт: ${minter.publicKey.toBase58()}`);

    return minter.publicKey.toBase58();
  } catch (error) {
    console.error("❌ Ошибка при создании токена:", error);
    throw error;
  }
}
