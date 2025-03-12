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
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";

interface Metadata {
  name: string;
  symbol: string;
  uri: string;
}

// СОЗДАЁТ АККАУНТ ДЛЯ КОЙНА И КУДА ТАК СКАЗАТЬ ЗАГРУЖЕН КОНТРАКТ
async function buildCreateTokenTransaction(
  connection: web3.Connection,
  payer: web3.PublicKey,
  minter: Keypair,
  decimals: number
): Promise<web3.Transaction> {
  // ОТПРАВКА СТАРТОВЫХ ТОКЕНОВ ДЛЯ СОЗДАНИЯ АККАУНТА
  const lamports = await token.getMinimumBalanceForRentExemptMint(connection);

  // УСТАНОВКА ID ПРОГРАММЫ К КАКОЙ ОТСНОСИТЬСЯ АККАУНТ
  const programId = TOKEN_PROGRAM_ID;

  // СОЗДАНИЕ АККАУНТА ДЛЯ ТОКЕНА
  var accountKeypair = web3.Keypair.generate();

  if (minter) {
    accountKeypair = minter;
  }

  // СОЗДАНИЕ ТРАНЗАКЦИИ
  const transaction = new Transaction({
    feePayer: payer,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
  });

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

  transaction.sign(accountKeypair);

  return transaction;
}

// СВЯЗЫВАЕТ АККАУНТ-ХРАНИЛИЩЕ С ТОКЕНОМ ДЛЯ ХРАНЕНИЯ БАЛАНСОВ
async function buildCreateAssociatedTokenAccountTransaction(
  connection: web3.Connection,
  payer: web3.PublicKey,
  mint: web3.PublicKey,
  associatedTokenAddress: web3.PublicKey
): Promise<web3.Transaction> {
  if (!associatedTokenAddress) {
    associatedTokenAddress = await token.getAssociatedTokenAddress(
      mint,
      payer,
      false
    );
  }

  const transaction = new Transaction({
    feePayer: payer,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
  });

  transaction.add(
    token.createAssociatedTokenAccountInstruction(
      payer,
      associatedTokenAddress,
      payer,
      mint
    )
  );

  return transaction;
}

// МИНТИТ ТОКЕНЫ
async function buildCreateMintTransaction(
  connection: web3.Connection,
  payer: web3.PublicKey,
  mint: web3.PublicKey,
  associatedTokenAddress: web3.PublicKey,
  supply: number,
  decimals: number
) {
  // СОЗДАНИЕ ТРАНЗАКЦИИ
  const transaction = new Transaction({
    feePayer: payer,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
  });

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

  return transaction;
}

// ДОБАВЛЯЕТ МЕТАДАННЫЕ В ТОКЕН
async function addMetaData(
  connection: any,
  walletContext: any,
  minter: any,
  metadata: Metadata
) {
  let _rpcEndpoint = connection._rpcEndpoint || clusterApiUrl("testnet");

  const umi = createUmi(_rpcEndpoint)
    .use(walletAdapterIdentity(walletContext))
    .use(mplTokenMetadata());

  //   const ourMetadata = {
  //     // TODO change those values!
  //     name: "KENYA",
  //     symbol: "KENYA",
  //     uri: "https://raw.githubusercontent.com/loopcreativeandy/video-tutorial-resources/main/metadataUpdate/metadata.json",
  //   };

  const onChainData = {
    ...metadata,
    // we don't need that
    sellerFeeBasisPoints: 0,
    creators: none<Creator[]>(),
    collection: none<Collection>(),
    uses: none<Uses>(),
  };

  //if (INITIALIZE) {

  const accounts: CreateMetadataAccountV3InstructionAccounts = {
    mint: minter,
    mintAuthority: walletContext.publicKey,
    updateAuthority: walletContext.publicKey,
    payer: umi.payer,
  };

  const data: CreateMetadataAccountV3InstructionDataArgs = {
    isMutable: true,
    collectionDetails: null,
    data: onChainData,
  };

  const txid = await createMetadataAccountV3(umi, {
    ...accounts,
    ...data,
  }).sendAndConfirm(umi);

  console.log(txid);

  //   } else {
  //     const data: UpdateMetadataAccountV2InstructionData = {
  //       data: some(onChainData),
  //       discriminator: 0,
  //       isMutable: some(true),
  //       newUpdateAuthority: none<PublicKey>(),
  //       primarySaleHappened: none<boolean>(),
  //     };
  //     const accounts: UpdateMetadataAccountV2InstructionAccounts = {
  //       metadata: findMetadataPda(umi, { mint: fromWeb3JsPublicKey(minter) }),
  //       updateAuthority: walletContext.publicKey,
  //     };
  //     const txid = await updateMetadataAccountV2(umi, {
  //       ...accounts,
  //       ...data,
  //     }).sendAndConfirm(umi);
  //     console.log(txid);
  //   }
}

export async function createSPLTokenWithMetadata(
  connectionContext: Connection,
  walletContext: any, // Phantom Wallet
  supply: number,
  decimals: number,
  metadata: Metadata
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

    let transctions = await buildCreateTokenTransaction(
      connection,
      walletContext.publicKey,
      minter,
      decimals
    );

    console.log(
      "Transaction Signature:",
      await walletContext.sendTransaction(transctions, connection)
    );
    console.log(`✅ Создан токен: ${minter.publicKey.toBase58()}`);

    // /// /// /// // /// / // / / / / // / / / / // /

    // 2. Получаем Associated Token Accounts

    let associatedTokenAddress = await token.getAssociatedTokenAddress(
      minter.publicKey,
      walletContext.publicKey,
      false
    );

    transctions = await buildCreateAssociatedTokenAccountTransaction(
      connection,
      walletContext.publicKey,
      minter.publicKey,
      associatedTokenAddress
    );

    console.log(
      "Transaction Signature:",
      await walletContext.sendTransaction(transctions, connection)
    );
    console.log(`✅ Создан аккаунт токена: ${minter.publicKey.toBase58()}`);

    // /// /// /// // /// / // / / / / // / / / / // /
    transctions = await buildCreateMintTransaction(
      connection,
      walletContext.publicKey,
      minter.publicKey,
      associatedTokenAddress,
      supply,
      decimals
    );

    console.log(
      "Transaction Signature:",
      await walletContext.sendTransaction(transctions, connection)
    );

    console.log(`✅ Токены сминчены в аккаунт: ${minter.publicKey.toBase58()}`);

    await addMetaData(connection, walletContext, minter.publicKey, metadata);

    return minter.publicKey.toBase58();
  } catch (error) {
    console.error("❌ Ошибка при создании токена:", error);
    throw error;
  }
}
