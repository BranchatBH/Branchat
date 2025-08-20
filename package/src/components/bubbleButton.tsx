import { GitBranchIcon } from 'lucide-react';
import React from 'react';

const BubbleButton = ({text} : {text:string}) => {
    const onClick = async () => {
        const res = await chrome.runtime.sendMessage({type:'OPEN_SIDEPANEL'});
        if(res?.success){
            await chrome.runtime.sendMessage({ type: 'SELECTION', text });
        }
        else{
            console.log(res);
            console.log(res?.error);
            console.log("error");
        }
    }
    const onMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
    };

    return(
      <button
        id="ext-add-to-prompt-btn"
        type="submit"
        className="btn relative bg-black btn-secondary active:opacity-1 shadow-long flex rounded-xl border-none"
        onMouseDown={onMouseDown}
        onClick={onClick}
      >
        <div className='flex items-center justify-center gap-1.5 whitespace-nowrap!'>
            <GitBranchIcon width={20} height={20}/>
            <div className="max-md:sr-only">Add to BranChat</div>
        </div>
      </button>
    )

}


export default BubbleButton;