// app/profile/[id]/page.tsx
'use client'
import { usePathname } from 'next/navigation';
// new imports
import {
  useProfile, usePublications, useFollow, useWalletLogin, useWalletLogout, useActiveProfile,
  Profile, ProfileOwnedByMe, NotFoundError
} from '@lens-protocol/react-web';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { formatPicture } from '../../../utils';

export default function Profile() {
  // new hooks
  const { execute: login } = useWalletLogin();
  const { execute: logout } = useWalletLogout();
  const { data: wallet } = useActiveProfile();
  const { isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  
  const pathName = usePathname()
  const handle = pathName?.split('/')[2]

  let { data: profile, loading } = useProfile({ handle })

  const { connectAsync } = useConnect({
    connector: new InjectedConnector(),
  });
  
  // new login function
  const onLoginClick = async () => {
    if (isConnected) {
      await disconnectAsync();
    }
    const { connector } = await connectAsync();
    if (connector instanceof InjectedConnector) {
      const signer = await connector.getSigner();
      await login(signer);
    }
  }

  if (loading) return <p className="p-14">Loading ...</p>

  return (
    <div>
      <div className="p-14">
        {
          !wallet && (
            <button className="bg-white text-black px-14 py-4 rounded-full mb-4" onClick={onLoginClick}>Sign In</button>
          )
        }
        {
          wallet && profile && (
            <>
            <FollowComponent
              isConnected={isConnected}
              profile={profile}
              wallet={wallet}
            />
            <button className="ml-4 bg-white text-black px-14 py-4 rounded-full mb-4" onClick={logout}>Sign Out</button>
            </>
          )
        }
        {
          profile && profile.picture?.__typename === 'MediaSet' && (
            <img
              width="200"
              height="200"
              alt={profile.handle}
              className='rounded-xl'
              src={formatPicture(profile.picture)}
            />
          )
        }
        <h1 className="text-3xl my-3">{profile?.handle}</h1>
        <h3 className="text-xl mb-4">{profile?.bio}</h3>
        { profile && <Publications profile={profile} /> }
      </div>
    </div>
  )
}

// new component
function FollowComponent({
  wallet,
  profile,
  isConnected
} : {
  isConnected: boolean,
  profile: Profile,
  wallet: ProfileOwnedByMe
}) {
  const { execute: follow } = useFollow({ followee: profile, follower: wallet  });
  return (
    <>
      {
        isConnected && (
          <button
            className="bg-white text-black px-14 py-4 rounded-full"
            onClick={follow}
          >Follow {profile.handle}</button>
        )
      }
    </>
  )
}

function Publications({
  profile
}: {
  profile: Profile
}) {
  let { data: publications } = usePublications({
    profileId: profile.id,
    limit: 20,
  })
  publications = publications?.map(publication => {
    if (publication.__typename === 'Mirror') {
      return publication.mirrorOf;
    } else {
      return publication;
    }
  });

  return (
    <>
      {
        publications?.map((pub: any, index: number) => (
          <div key={index} className="py-4 bg-zinc-900 rounded mb-3 px-4">
            <p>{pub.metadata.content}</p>
            {
              pub.metadata?.media[0]?.original && ['image/jpeg', 'image/png'].includes(pub.metadata?.media[0]?.original.mimeType) && (
                <img
                  width="400"
                  height="400"
                  alt={profile.handle}
                  className='rounded-xl mt-6 mb-2'
                  src={formatPicture(pub.metadata.media[0])}
                />
              )
            }
          </div>
        ))
    }
    </>
  )
}