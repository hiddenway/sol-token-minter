export default function Header(props:any) {
    return (
        <div className="header">
            <h1>Solana Token Panel</h1>
            <p>Wallet Address: {props.walletAddress}</p>
            <hr />
        </div>
    )
}