import { useEffect, useState } from "react";
import VideoCard from "../components/VideoCard";

const Home=()=>{
    const [videos, setVideos]=useState<string[]>([]);
    useEffect(()=>{
        const fetchVideos=async(): Promise<void>=>{
            try{
                const res:Response = await fetch('/api/videos');
                const data: string[] = await res.json();
                setVideos(data);
            }
            catch(error: unknown){
                console.log(error);
            }
        }
        fetchVideos();
    },[])
    console.log(videos);

    return(
        <div className="home">
        <h2>Avialable Videos</h2>
        {videos.map(name=>{
            return(
                <VideoCard fileName={name} />
            )
        })}
        </div>
    )
}

export default Home;