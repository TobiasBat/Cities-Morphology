<script lang="ts" setup>
import cshLogoUrl from '@/assets/images/Complexity-Science-Hub_schwarz_RGB.svg'
</script>

<template>
    <section class="credits">
        <a href="http://csh.ac.at" target="_blank" class="cshLogo"><img :src="cshLogoUrl"></a>
        <div>
            <p>
                <b>Visualization</b><br>
                Tobias Batik
                <br>
                <br>
            </p>
        </div>
        <div class="wide">
            <p>
                <b>More Visualizations</b><br>
                <a href="https://csh.ac.at/visuals/" target="_blank">csh.ac.at/visuals/</a>
                <br>
                <br>
            </p>
        </div>
    </section>
</template>

<style scoped>
.credits {
    font: var(--font-family);
    color: var(--font-color);
    font-size: var(--font-size);
    line-height: var(--line-height);
    padding: 120px;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    background-color: var(--bg-color);
    gap: 10px;
}

.credits b {
    font-weight: 500;
}

.credits>div {
    width: 250px;
}

.credits>div.wide {
    width: 500px;
}

.credits>div>p {
    margin-bottom: 12px;
}

.cshLogo {
    min-width: 250px;
    padding-right: 100px;
}

a {
    color: var(--font-color);
}

@media only screen and (max-width: 800px) {
    .credits {
        padding-top: 20px;
        padding-bottom: 100px;
        padding-left: 20px;
        padding-right: 20px;
        width: calc(100% - 0px);
        flex-direction: column;
        gap: 12px;
    }

    .credits>div.wide,
    .credits>div {
        width: 100%;
    }

    .credits>div>p {
        margin-bottom: 12px;
    }

    .cshLogo {
        max-width: 50%;
        width: 200px;
        padding-top: 30px;
        padding-bottom: 30px;
    }
}

@media (prefers-color-scheme: dark) {
    .cshLogo {
        filter: invert(1);
    }
}
</style>