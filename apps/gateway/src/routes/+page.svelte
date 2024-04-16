<script lang="ts">
    import { Button } from '$lib/components/ui/button' 

    const fetchGreeting = async () => {
        const res = await fetch('/api/hooks')
        const data = await res.json()
        returnValue = data.message
    }

    $: returnValue = ''
</script>

<div>
    <Button on:click={fetchGreeting}>Click Me!</Button>
    <p>{returnValue}</p>
</div>