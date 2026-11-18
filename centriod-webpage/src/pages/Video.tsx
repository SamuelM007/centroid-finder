
import Preview from "../components/Preview";
import { useParams } from "react-router-dom";

const Video =()=>{
    const {fileName} = useParams<{fileName: string}>()
   

    return(
        <div className="video">
            <Preview fileName={fileName!} />
        </div>
    )
}

export default Video;