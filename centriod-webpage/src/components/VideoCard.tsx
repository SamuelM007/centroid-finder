import { Link } from "react-router-dom"
import Thumbnail from "./Thumbnail"

const VideoCard=({fileName}:{fileName:string})=>{
    return(
        <Link to={`/video/${fileName}`} className="videoCard">
            <p className="title">{fileName}</p>
            <Thumbnail fileName={fileName}/>
        </Link>
    )
}

export default VideoCard;
