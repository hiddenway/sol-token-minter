import { config } from "../config";

export default function Footer() {
    return (
        <div className="footer text-center mt-5 ">
            <p>Need support? Contact us at <a href={config.supportLink}>Telegram</a></p>
        </div>
    );
}