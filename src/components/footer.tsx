import { config } from "../config";

export default function Footer() {
    return (
        <div className="footer text-center mt-5 ">
            <div className="list-group-inline text-center">
                <a href={config.supportLink} className="m-2">Support</a>
                <a href="/" className="m-2">Main Page</a>
            </div>
            <p>Need support? Contact us at <a href={config.supportLink}>Telegram</a></p>
        </div>
    );
}