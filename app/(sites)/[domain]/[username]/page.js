



export default async function Page({ params, searchParams }) {
    const { domain, username, eventLink } = await params


    return (
        <main className="">
            <div>
                <div>My username: {username} | Domain: {domain} </div>
            </div>
        </main>
    )
}
