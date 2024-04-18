<script lang="ts">
    import { client } from '$lib/utils/client.util'
    import { Button } from '$lib/components/ui/button' 
    
    const fetchGreeting = async () => {
        const res = await client.api.test.index.get()
        returnValue = res.data?.msg ?? ''

        const chat = client.api.test.ws.subscribe()
        chat.subscribe((message) => {
            console.log('got', message)
        })
        chat.send({ message: 'Hello World'})
    }   

    $: returnValue = ''
</script>

<div>
    <Button on:click={fetchGreeting}>Click Me!</Button>
    <p>{returnValue}</p>
</div>