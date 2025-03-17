import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Header(props: any) {
  return (
    <div className="header list-group-inline">
      <div className="container pt-3 d-flex justify-content-between align-items-center">
        <h1 className="mb-0 gradient-title">Solfun Tools</h1>
        <div className="d-flex align-items-center gap-3">
          {/* <span>Wallet Address: {props.walletAddress}</span> */}
          <WalletMultiButton />
        </div>
      </div>
      <hr />
    </div>
  );
}