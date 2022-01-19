const { createApi } = require("unsplash-js");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const UNSPLASH_ACCESS_KEY = requireVariable("UNSPLASH_ACCESS_KEY");
const UNSPLASH_COLLECTION_ID = requireVariable("UNSPLASH_COLLECTION_ID");

async function main() {
    const unsplash = createApi({
        accessKey: UNSPLASH_ACCESS_KEY,
        fetch
    });

    const photos = await getImageData(unsplash);
    const html = fs.readFileSync("./src/index.html", { encoding: "utf-8"});

    fs.writeFileSync(
        "./docs/index.html",
        html.replace("[/* PHOTO DATA GOES HERE */];", JSON.stringify(photos)),
        { encoding: "utf-8" }
    );
}

async function getImageData(unsplash) {
    const photos = [];
    let page = 1;

    while (true) {
        const response = await unsplash.collections.getPhotos({ collectionId: UNSPLASH_COLLECTION_ID, page });
        if (response.type !== 'success') {
            console.error("Response:", response);
            throw new Error("An error occurred making a request to unsplash.");
        }

        photos.push(...response.response.results.map((photo) => ({
            id: photo.id,
            description: photo.description,
            image_url: photo.urls.full,
            user_name: photo.user.name ?? photo.user.username,
            user_link: photo.user.links.html,
        })));

        if (response.response.total === photos.length) {
            break;
        }
        page++;
    }
    console.log(`Found ${photos.length} photos in collection.`);
    return photos;
}

function requireVariable(x) {
    const value = process.env[x];
    if (typeof value === "undefined") {
        throw new Error(`This program requires the '${x}' environment variable to be set.`);
    }
    return value;
}

main();