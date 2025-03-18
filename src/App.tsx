import { useState, useContext } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react"; // Подключаем Phantom Wallet
import { WalletModalContext } from "@solana/wallet-adapter-react-ui";
// Кнопка подключения кошелька
import { createSPLTokenWithMetadata } from "./scripts/token";
import { uploadImageToIPFS, uploadJSONToIPFS } from "./scripts/ipfs";
import Header from "./components/headers";
import TokenSettings from "./components/tokenSettings";

import "@solana/wallet-adapter-react-ui/styles.css"; // Стили кнопки Phantom
import Footer from "./components/footer";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "./index.css";

function App() {
  const [tokenName, setTokenName] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenTicker, setTokenTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [description, setDescription] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState("6");

  const [tokenLogo, setTokenLogo] = useState<File | Blob>();
  const [tokenLogoLink, setTokenLogoLink] = useState("");
  const [tokenSupplyText, setTokenSupplyText] = useState("");

  const [revokeFreeze, setRevokeFreeze] = useState(false);
  const [revokeMint, setRevokeMint] = useState(false);

  const [errors, setErrors] = useState({
    tokenName: false,
    tokenSupply: false,
    tokenDecimals: false,
    tokenTicker: false,
    tokenLogo: false,
    tokenDescription: false,
  });

  const validateForm = () => {
    const newErrors = {
      tokenName: !tokenName.trim(),
      tokenSupply: !tokenSupplyText.trim(),
      tokenDecimals: tokenDecimals === "" || isNaN(Number(tokenDecimals)),
      tokenTicker: !tokenTicker.trim(),
      tokenLogo: !tokenLogo,
      tokenDescription: !description,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).includes(true);
  };

  function useOpenWalletModal() {
    const { setVisible } = useContext(WalletModalContext); // Контекст для открытия попапа
    const { wallet, connect } = useWallet();
  
    return async () => {
      try {
        if (!wallet) {
          setVisible(true); // Открываем WalletMultiButton popup
          return;
        }
  
        await connect(); // Подключаемся, если кошелек уже выбран
      } catch (error) {
        console.error("Ошибка при подключении кошелька:", error);
      }
    };
  }

  const openWalletModal = useOpenWalletModal();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ File is too large! Maximum size is 5MB.");
        setMessageType("error");
        return;
      }
      setTokenLogo(file);
      setTokenLogoLink(URL.createObjectURL(file));
    }
  };

  const { connection } = useConnection();
  const wallet = useWallet(); // Получаем объект кошелька Phantom

  async function releaseToken() {
    validateForm();

    if (!wallet.connected) {
      setMessage("❌ Connect Phantom Wallet!");
      setMessageType("error");
      return;
    }
    if (!tokenName || !tokenTicker || !tokenAmount || !description) {
      setMessage("❌ Fill in all required fields!");
      setMessageType("error");
      return;
    }
    if (isNaN(Number(tokenAmount)) || Number(tokenAmount) <= 0) {
      setMessage("❌ Invalid token amount!");
      setMessageType("error");
      return;
    }
    if (!tokenLogo) {
      setMessage("❌ Upload a token logo!");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const metaDataURL = await deployMetadataJSON(
        tokenName,
        tokenTicker,
        description
      );

      const tokenAddress = await createSPLTokenWithMetadata(
        connection,
        wallet,
        Number(tokenAmount),
        9,
        {
          name: tokenName,
          symbol: tokenTicker,
          uri: metaDataURL,
        },
        revokeMint,
        revokeFreeze
      );

      setMessage(`✅ Token created: ${tokenAddress}`);
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("❌ Error creating token!");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function deployMetadataJSON(
    tokenName: string,
    tokenTicker: string,
    description: string
  ) {
    if (!tokenLogo) throw new Error("Token logo can't be empty");

    let imageId = await uploadImageToIPFS("tokenLogo", tokenLogo);

    let metadata = {
      name: tokenName,
      symbol: tokenTicker,
      description: description,
      image: `https://${imageId}.ipfs.dweb.link`,
    };
    let cid = await uploadJSONToIPFS(metadata);

    return `https://${cid}.ipfs.dweb.link`;
  }

  const formatNumber = (num: string) => {
    console.log("String: ", num.replace(/\B(?=(\d{3})+(?!\d))/g, " "));
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const tokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ""); // Оставляем только цифры
    setTokenSupplyText(formatNumber(rawValue)); // Форматируем с пробелами
    setTokenAmount(rawValue); // Храним чистое число
  };

  return (
    <>
      <Header />
      <div className="container py-5 p-3">
        {/* Кнопка подключения Phantom */}
        <div className="row mb-5">
          <h1 className="text-center">Solana Token Creator</h1>
          <h3 className="text-center gradient-description">
          Create tokens in a few clicks! (Watch the video tutorial{" "}
            <a
              href="https://youtu.be/5-8-0-9-5"
              target="_blank"
              rel="noreferrer"
            >
              here
            </a>
            )
          </h3>
        </div>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="input-form card text-light py-3">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="token-name">
                        <span className="text-danger">*</span> Token Name
                      </label>
                      <div className="form-control-wrapper">
                        {" "}
                        <input
                          type="text"
                          value={tokenName}
                          maxLength={32}
                          onChange={(e) => setTokenName(e.target.value)}
                          className={`form-control ${
                            errors.tokenName ? "is-invalid" : ""
                          }`}
                          id="token-name"
                          placeholder="Ex: Solana"
                        />
                      </div>
                      <div className="invalid-feedback" style={{ display: errors.tokenName ? "block" : "none" }}>
                        Token Name is required.
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="token-amount">
                        <span className="text-danger">*</span> Token Supply
                      </label>
                      <div className="form-control-wrapper">
                        {" "}
                        <input
                          type="text"
                          value={tokenSupplyText}
                          maxLength={15}
                          onChange={tokenAmountChange}
                          className={`form-control ${
                            errors.tokenSupply ? "is-invalid" : ""
                          }`}
                          id="token-amount"
                          placeholder="1 000 000 000"
                        />
                      </div>
                      <div className="invalid-feedback" style={{ display: errors.tokenSupply ? "block" : "none" }}>
                        Token Supply is required.
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="token-amount">
                        <span className="text-danger">*</span> Token Decimals
                      </label>
                      <div className="form-control-wrapper">
                        {" "}
                        <input
                          type="number"
                          value={tokenDecimals}
                          max={9}
                          onChange={(e) => {
                            const value = Math.min(9, Number(e.target.value)); // Ограничение на 9
                            setTokenDecimals(value.toString());
                          }}
                          className={`form-control ${
                            errors.tokenDecimals ? "is-invalid" : ""
                          }`}
                          id="token-decimals"
                          placeholder="6"
                        />
                      </div>
                      <div className="invalid-feedback" style={{ display: errors.tokenDecimals ? "block" : "none" }}>
                        Decimals is required.
                      </div>
                    </div>
                  </div>
                  {/* Token Image (теперь справа) */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="token-ticker">
                        <span className="text-danger">*</span> Symbol
                      </label>
                      <div className="form-control-wrapper">
                        <input
                          type="text"
                          maxLength={8}
                          value={tokenTicker}
                          onChange={(e) => setTokenTicker(e.target.value)}
                          className={`form-control ${
                            errors.tokenTicker ? "is-invalid" : ""
                          }`}
                          id="token-ticker"
                          placeholder="SOL"
                        />
                      </div>
                      <div className="invalid-feedback" style={{ display: errors.tokenTicker ? "block" : "none" }}>
                        Token Ticker is required.
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="file-input">
                        <span className="text-danger">*</span> Token Image
                      </label>
                      <div className="upload-container">
                        <div className="form-control-wrapper">
                          {!tokenLogo && (
                            <label className="upload-box">
                              <i className="bi bi-cloud-upload"></i>
                              <p>Drag and drop here to upload</p>
                              <small>.png .jpg max 5 mb</small>
                              <input
                                type="file"
                                id="file-upload"
                                onChange={handleFileChange}
                                className={`form-control ${
                                  errors.tokenLogo ? "is-invalid" : ""
                                }`}
                                accept=".png, .jpg"
                                hidden
                              />
                              <div className="invalid-feedback" style={{ display: errors.tokenLogo ? "block" : "none" }}>
                                Token Logo is required.
                              </div>
                            </label>
                          )}
                          {tokenLogo && (
                            <label className="upload-box">
                              <img
                                src={tokenLogoLink}
                                alt="Preview"
                                className="mt-2 w-full h-full control object-cover rounded-lg"
                              />
                              <input
                                type="file"
                                id="file-upload"
                                onChange={handleFileChange}
                                className={`form-control ${
                                  errors.tokenName ? "is-invalid" : ""
                                }`}
                                accept=".png, .jpg"
                                hidden
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="description-input">
                      <span className="text-danger">*</span> Description
                    </label>
                    <div className="form-control-wrapper">
                      {" "}
                      <textarea
                        id="description-input"
                        value={description}
                        maxLength={500}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`description form-control ${
                          errors.tokenDescription ? "is-invalid" : ""
                        }`}
                        placeholder="Ex: The most popular coin on Solana."
                      />
                    </div>
                    <div className="invalid-feedback" style={{ display: errors.tokenDescription ? "block" : "none" }}>
                      Description is required.
                    </div>
                  </div>
                  <TokenSettings
                    revokeFreeze={revokeFreeze}
                    setRevokeFreeze={setRevokeFreeze}
                    revokeMint={revokeMint}
                    setRevokeMint={setRevokeMint}
                  />
                </div>
                {message && (
                  <div
                    className={`alert ${
                      messageType === "success"
                        ? "alert-success"
                        : "alert-danger"
                    } mt-2`}
                    role="alert"
                  >
                    {message}
                  </div>
                )}
                <hr />
                {loading ? (
                  <button
                    type="button"
                    className="btn w-100 btn-create-coin"
                    disabled
                  >
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>{" "}
                    Creating...
                  </button>
                ) : !wallet.connected ? (
                  <button
                    type="button"
                    className="btn w-100 btn-create-coin"
                    id="connect-wallet"
                    onClick={openWalletModal} // Теперь вызывает подключение кошелька
                  >
                    Connect Wallet
                  </button>
                ) : !tokenTicker ? (
                  <button
                    type="button"
                    className="btn w-100 btn-create-coin"
                    id="create-token"
                    onClick={releaseToken}
                  >
                    Create Token (Fee 0.2 SOL)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn w-100 btn-create-coin"
                    id="create-token"
                    onClick={releaseToken}
                  >
                    Create Token ${tokenTicker} (Fee 0.2 SOL)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

export default App;
