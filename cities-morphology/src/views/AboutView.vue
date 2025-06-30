<script lang="ts" setup>
import { RouterLink } from 'vue-router';
import FooterComponent from '@/components/Footer.vue';
import profileImage from '@/assets/images/cities-morphology_profile.jpg'
import profileImageDark from '@/assets/images/cities-morphology_profile_dark.jpg'
import sizeImage from '@/assets/images/cities-morphology_persPerBuilding.png'
import sizeImageDark from '@/assets/images/cities-morphology_persPerBuilding-dark.png'
import parameterVideo from '@/assets/video/parametervideo.mp4'

import residentsIcon from '@/assets/images/variableIcons/population-color.png'
import elongationIcon from '@/assets/images/variableIcons/elongation-color.png'
import sprawlIcon from '@/assets/images/variableIcons/spall-color.png'
import profileIcon from '@/assets/images/variableIcons/heightDist-color.png'
import floorsIcon from '@/assets/images/variableIcons/floors-color.png'
import numPersonIcon from '@/assets/images/variableIcons/personPerBuilding-color.png'
</script>
<template>
    <div id="contentWrapper">
        <div id="content">
            <h2 id='about-cities-morphology'>About Cities Morphology</h2>
            <p>
                <em>Cities Morphology</em> is an interactive tool for exploring the ideal shape of cities. Instead of
                analyzing existing cities, it follows the inverse approach of showing the effect of different city
                constructions. By providing high-level parameters (e.g., number of inhabitants, space between
                buildings), a corresponding city is constructed that houses the population. This provides an approach to
                exploring future city layout paradigms. A simulation is run in that city, providing insights into the
                average and expected travel distances and the city&#39;s travel-related energy consumption.
            </p>
            <h3 id='constructing-the-city'>Constructing the City</h3>
            <p>
                Cities Morphology exposes six different parameters for constructing a city. Each parameter is
                independent, and each combination of parameter values leads to a unique city layout.
            </p>
            <p>
                The <img :src="residentsIcon">residents parameter describes the number of residents the virtual city
                accommodates. In our model, each resident consumes the same amount of apartment space; therefore, the
                apartment area of the whole city scales linearly with the number of residents.
            </p>
            <p>
                <img :src="elongationIcon">Elongation describes the &quot;roundness&quot; of a city. The city&#39;s
                houses are fitted inside an ellipse defined by the elongation parameter. This parameter value represents
                the ratio between the shortes and longes extension of the ellipse. Hence, an elongation = 1 describes a
                circle where the shortest extension equals the longest. Higher values represent a more elliptical city
                layout.
            </p>
            <p>
                The <img :src="sprawlIcon">sprawl value alters the space between buildings. The use of this additional
                space is not further defined. The area can be parking spaces, streets, or green spaces. If the
                city&#39;s sprawl increases, the space between buildings increases, resulting in a higher overall
                footprint of the city.
            </p>

            <img :src="sizeImage" class="parameterImage light">
            <img :src="sizeImageDark" class="parameterImage dark">
            <div class="caption wide">
                Cities with the same number of residents but different numbers of buildings result from a different
                number of people per house.
            </div>

            <p>
                In Cities Morphology, the number of buildings is not directly defined. Instead, the number of buildings
                results from the number of inhabitants and people living in a building. If the number of <img
                    :src="numPersonIcon">persons per building is low, the city consists of many smaller houses — like
                suburban residential areas. A higher person per building value results in a city with fewer but larger
                buildings. Besides the buildings&#39; size, the average height of the building is variable. The <img
                    :src="floorsIcon">floor parameter describes the average number of floors of the buildings. Changing
                this parameter does not affect the volume of the buildings. A building that houses 20 people and has two
                floors has the same volume as an equally large house with ten floors. However, increasing the height
                decreases the footprint of the building, resulting in a denser city with a smaller overall footprint.
            </p>
            <p>
                The <img :src="profileIcon">profile parameter manipulates the distribution of building heights—a value
                of zero results in a city where all houses are equal in height (pancake city). Greater values result in
                a city where buildings located in the center are taller, and houses further away have fewer floors
                (Pyramid City). Values smaller than zero have the opposite effect, creating high buildings on the
                outskirts of the city, resulting in a city shaped like a bowl. Notice that the <img
                    :src="profileIcon">profile parameter does not affect the overall apartment space of the city or its
                volume. It only changes the height
                distribution.
            </p>
            <img :src="profileImage" class="parameterImage light">
            <img :src="profileImageDark" class="parameterImage dark">
            <div class="caption wide">The figure shows three cities, each with a different profile parameter.
            </div>


            <h3 id='simulation'>Simulation</h3>
            <p>
                To compute the city&#39;s travel distance, we run a simulation. Here, we select a number of random start
                and end locations. We only consider houses as start and end points, and the number of start-end point
                pairs equals the number of residents. Then, we compute the shortest possible path for all pairs. The
                lengths of the paths give the city&#39;s overall and average travel distance.
            </p>
            <p>
                The simulation only provides insights into travel distance; hence, Cities Morphology does not consider
                traffic and travel speed. Therefore, the cost for each street section in the shortest path computation
                is determined by its length. The likelihood of selecting a building in the city as the start and
                endpoint depends on its size. If all buildings in the city are equal in size (Profile parameter equals
                zero), all builds are equally likely to be selected as a start or an endpoint of a path. If the
                buildings in the center are taller — and therefore house more people — these buildings become more
                likely to be selected as a start or end of travel.
            </p>
            <h3 id='visualization'>Visualization </h3>
            <p>
                The virtual cities are represented as a 3D model. The parameters can be freely altered, and the
                visualization immediately provides feedback—showing the effects of the individual parameters on the city
                shapes and travel distance. For a seamless experience and fast feedback, the city&#39;s layout,
                simulations, and house geometries are all computed locally in the browser, utilizing web workers to
                parallelize the computation.
            </p>
            <p>
                Besides providing a three-dimensional representation of the created city, the visualization also
                displays the average travel distance and congestion levels in different parts of the simulated city.
                When the <em>Distance</em> option is selected on the <RouterLink to="/compare" target="_blank">compare
                    page</RouterLink>, the color of an individual street segment represents the average travel distance
                of allagent paths that pass through that segment. When the average travel distance of a city increases —
                more streets should be colored red, encoding that, on average, longer travels pass through the streets.
                By switching to the <em>Congestion</em> mode, the color of the streets encodes the number of journeys
                that pass through a street. If more agents use a street section, it is colored darker than one that is
                less frequently used. For example, in a pyramid city with high buildings in the center, streets in the
                city center are more congested compared to a pancake city where all houses are approximately equal in
                height.
            </p>
            <p>
                The <RouterLink to="/compare">Compare page</RouterLink> utilizes parameter spaces that are optimized to
                visually explain the concept of our model and highlight how certain properties of a city's morphology
                affect its travel time and distance rather than evaluating existing cities. To test real-sized cities,
                use the <RouterLink to="/calculator">calculator</RouterLink>. To test even larger cities, we made the
                source code of Cities morphology <a href="https://github.com/TobiasBat/Cities-Morphology"
                    target="_blank">publicly available.</a>
            </p>

            <video muted autoplay loop playsinline>
                <source :src="parameterVideo" type="video/mp4">
            </video>
            <div class="caption wide">Screen-recording of Cities Morphology.</div>

            <p>
                Cities Morphology is inspired by the scientific paper &quot;<a
                    href="https://www.pnas.org/doi/10.1073/pnas.2214254120" target="_blank">Scaling of the morphology of
                    African cities&quot;</a>[1]. The work provides a model to denote and analyze city shapes. Based on a
                city&#39;s number of buildings, sprawl, and elongation, its average and total travel distance are
                approximated. This interactive visualization provides an approach for the inverse scenario — enabling
                one to model and analyze a city based on variable parameters. It extends the work by introducing
                parameters for building sizes, heights, and the city&#39;s profile – the distribution of building
                heights.
            </p>
            <p>&nbsp;</p>
            <p>[1] Prieto-Curiel, Rafael, Jorge E. Patino, and Brilé Anderson. &quot;Scaling of the morphology of
                African
                cities.&quot; Proceedings of the National Academy of Sciences 120.9 (2023)</p>
        </div>
    </div>
    <div id="footerContainer">
        <FooterComponent />
    </div>
</template>
<style scoped>
#contentWrapper {
    width: calc(100% - 0);
    background-color: var(--bg-color2);
    padding-left: 12px;
    padding-right: 12px;
    box-sizing: border-box;
    padding-top: 40svh;
    padding-bottom: 20svh;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    display: flex;
    min-height: 80svh;
    border-radius: 6px;
    position: relative;
    left: 0;
    justify-content: center;
}

#content {
    width: 100%;
    /* max-width: 700px; */
    font-size: var(--font-size-text);
    line-height: calc(var(--font-size-text) * 1.3);
    display: flex;
    flex-direction: column;
    align-items: center;
}

a {
    color: var(--color-text-shade1);
    font-style: italic;
    cursor: pointer;
}

p img {
    height: calc(var(--font-size-text) * 0.6);
    margin-right: calc(var(--font-size-text) * 0.2);
}



p,
h2,
h3 {
    max-width: 800px;
    width: 100%;
}

#navComp {
    position: fixed;
}

#footerContainer {
    width: calc(100vw - 0);
    margin-left: var(--nav-width);
}


.parameterImage {
    width: calc(100% + 20px);
    max-width: 1200px;
    /* max-width: 900px; */
    margin-block-start: calc(var(--font-size-text) * 5.0);
    border-radius: 5px;
    background-color: rgb(233, 233, 233);
}

.parameterImage.dark {
    display: none;
}

.parameterImage.light {
    display: inherit;
}

.caption {
    font-style: italic;
    color: var(--color-text-shade2);
    max-width: 800px;
    width: 100%;
    margin-block-start: calc(var(--font-size-text) * 1);
    margin-block-end: calc(var(--font-size-text) * 5);
}

.caption.wide {
    max-width: 1200px;
}

video {
    width: 100%;
    max-width: 1200px;
    border-radius: 4px;
    margin-block-start: calc(var(--font-size-text) * 5.0);
    filter: saturate(1.3);
}

@media screen and (max-width: 600px) {
    #contentWrapper {
        padding-top: 40px;
    }

    h2 {
        font-size: 20px;
        line-height: 20px;
    }

    h3 {
        margin-block-start: 90px;
    }

    p {
        margin-block-end: calc(var(--font-size-text) * 0.9);
        hyphens: auto;
        font-weight: 400;
        text-align: left;
        font-size: 16px;
        line-height: 19px;
    }
}

@media (prefers-color-scheme: dark) {
    .parameterImage {
        border: solid var(--color-text-shade1) 0.5px;
    }

    .parameterImage.dark {
        display: inherit;
    }

    .parameterImage.light {
        display: none;
    }
}

@media screen and (min-width: 2000px) {

    p,
    h2,
    h3 {
        max-width: 1200px;
    }

    .parameterImage {
        max-width: 1800px;
        margin-block-start: calc(var(--font-size-text) * 8);
    }

    .caption {
        max-width: 1200px;
        margin-block-start: calc(var(--font-size-text) * 1);
        margin-block-end: calc(var(--font-size-text) * 8);
    }

    .caption.wide {
        max-width: 1800px;
    }

    video {
        width: 100%;
        max-width: 1800px;
        margin-block-start: calc(var(--font-size-text) * 8);
    }
}
</style>