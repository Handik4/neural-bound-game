const Util = {
    limit: (value, min, max) => Math.max(min, Math.min(value, max)),
    increase: (start, increment, max) => {
        let result = start + increment;
        while (result >= max) result -= max;
        while (result < 0) result += max;
        return result;
    },
    overlap: (x1, w1, x2, w2) => {
        let half = (w1 + w2) / 2;
        return Math.abs(x1 - x2) < half;
    },
    exponentialFog: (distance, density) => 1 / Math.pow(Math.E, (distance * distance * density)),
    project: (p, cameraX, cameraHeight, worldOffset, cameraDepth, width, height, roadWidth) => {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraHeight;
        p.camera.z = (p.world.z || 0) - worldOffset;
        p.screen.scale = cameraDepth / p.camera.z;
        p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
        p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
        p.screen.w = Math.round((p.screen.scale * roadWidth * width / 2));
    }
};

const Render = {
    polygon: (ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
        ctx.closePath(); ctx.fill();
    },
    segment: (ctx, width, lanes, x1, y1, w1, x2, y2, w2, fog, color) => {
        let r1 = w1 / 10, r2 = w2 / 10;
        ctx.fillStyle = color.grass;
        ctx.fillRect(0, y2, width, y1 - y2);
        Render.polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);
        Render.polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
        Render.polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
        if (color.lane) {
            let lineW1 = w1 / 20, lineW2 = w2 / 20;
            Render.polygon(ctx, x1 - lineW1, y1, x1 + lineW1, y1, x2 + lineW2, y2, x2 - lineW2, y2, color.lane);
        }
    }
};