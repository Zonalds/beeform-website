



export default async function Page({ params, searchParams }) {
    const { domain, username, eventLink } = await params


    return (
        <main className="">
            <div>
                <div>My Formx: {username} | Domain: {domain} </div>
            </div>
        </main>
    )
}
