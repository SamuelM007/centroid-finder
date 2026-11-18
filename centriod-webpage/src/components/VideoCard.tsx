import Thumbnail from "./Thumbnail"

const VideoCard=({fileName}:{fileName:string})=>{
    return(
        <div className="videoCard">
            <p className="title">{fileName}</p>
            <Thumbnail fileName={fileName}/>
        </div>
    )
}

export default VideoCard;