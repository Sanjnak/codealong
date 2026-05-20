import React from 'react'
import Avatar from 'react-avatar'

const Member = ({key, username}) => {
    // console.log(username);
    return (
        <div className="flex flex-col items-center gap-1 p-1">
            <Avatar name={username} 
            size={40}
            className="lg:w-[50px] lg:h-[50px] w-[40px] h-[40px]"
            round="14px"
            />
            <span className="text-xs lg:text-sm font-semibold text-center break-words w-12 lg:w-16">{username}</span>
        </div>
    )
}

export default Member