/* Shape */
var Shape = function (data)
{
    this.boundX = data.boundX || 800;
    this.boundY = data.boundY || 600;
    this.start = data.start || new Point({});
    this.end = data.end || new Point({});
    this.mode = data.mode || '';
    this.color = data.color || 'black';
    this.line = data.line || 1;
    this.points = data.points || [];
    this.numberOfAngles = data.numberOfAngles || 3;
    this.shape = data.shape || '';
    this.illustration = data.illustration || '';
    this.isFilled = data.isFilled || false;
    this.scaleX = data.scaleX || 1;
    this.scaleY = data.scaleY || 1;

    this.withShift = data.withSfalse || false;
    this.withCtrl = data.withCtrl || false;

    this.width = data.width || 0;
    this.height = data.width || 0;

    this.leftTop = new Point({});
    this.rightBottom = new Point({});

    this.imageData = null;

    this.anchors = [new Anchor({}), new Anchor({}), new Anchor({}), new Anchor({})];
    this.scaleShift = data.scaleShift || false;

    this.fillColor = null;
}

Shape.prototype.draw = function (context)
{
    this.setBound();
    context.beginPath();
    var center = new Point({});
    center.x = (this.leftTop.x + this.rightBottom.x) / 2;
    center.y = (this.leftTop.y + this.rightBottom.y) / 2;
    switch (this.mode) {
        case 'paint-bucket':
            this.imageData = context.getImageData(0, 0, this.boundX, this.boundY);
            if (!this.points.length) {
                var offset = (this.start.y * this.boundX + this.start.x) * 4;
                var originalColor = this.imageData.data.slice(offset, offset + 4);
                this.fillStart = this.start;
                context.fillStyle = this.color;
                context.fillRect(this.start.x, this.start.y, 1, 1);
                context.fill();
                this.fillColor = context.getImageData(this.start.x, this.start.y, 1, 1).data;
                this.fill(this.fillStart.x, this.fillStart.y, originalColor);
            } else {
                var shape = this;
                shape.points.forEach(function (point) {
                    var x = point.x + shape.start.x;
                    var y = point.y + shape.start.y;
                    if (x < 0 || x > shape.boundX || y < 0 || y > shape.boundY) {
                        return;
                    }
                    var offset = (y * shape.boundX + x) * 4;
                    for (var i = 0; i < 3; i++) {
                        shape.imageData.data[offset + i] = shape.fillColor[i];
                    }
                });
            }
            context.putImageData(this.imageData, 0, 0);
            this.imageData = null;
            break;
        case 'brush':
            var shape = this;
            shape.points.forEach(function (point) {
                var x = ((shape.start.x + point.x) - center.x) * shape.scaleX;
                var y = ((shape.start.y + point.y) - center.y) * shape.scaleY;
                context.lineTo(x + center.x, y + center.y);
                context.moveTo(x + center.x, y + center.y);
            });
            break;
        case 'line':
            var x = center.x + (this.start.x - center.x) * this.scaleX;
            var y = center.y + (this.start.y - center.y) * this.scaleY;
            context.moveTo(x, y);
            if (this.withShift) {
                var distanceX = Math.abs(this.end.x - this.start.x);
                var distanceY = Math.abs(this.end.y - this.start.y);
                if (distanceX > distanceY) {
                    x = center.x + (this.end.x - center.x) * this.scaleX;
                    y = center.y + (this.start.y - center.y) * this.scaleY;
                } else {
                    x = center.x + (this.start.x - center.x) * this.scaleX;
                    y = center.y + (this.end.y - center.y) * this.scaleY;
                }
            } else {
                x = center.x + (this.end.x - center.x) * this.scaleX;
                y = center.y + (this.end.y - center.y) * this.scaleY;
            }
            context.lineTo(x, y);
            break;
        case 'shape':
            switch (this.shape) {
                case 'oval':
                    var x = center.x + (this.start.x - center.x) * this.scaleX;
                    var y = center.y + (this.start.y - center.y) * this.scaleY;
                    var width = Math.abs(x - (center.x + (this.end.x - center.x) * this.scaleX));
                    var height = Math.abs(y - (center.y + (this.end.y - center.y) * this.scaleY));

                    context.save();
                    if (this.withShift) {
                        context.arc(x, y, width, 0, 2 * Math.PI);
                    } else {
                        context.scale(1, height / width);
                        context.arc(x, y / (height / width), width, 0, 2 * Math.PI);
                    }
                    context.restore();

                    break;
                case 'polygon':
                    var width = Math.abs(this.start.x - this.end.x);
                    var height = Math.abs(this.start.y - this.end.y);
                    var angle = 2 * Math.PI / this.numberOfAngles;
                    var rotate = Math.PI / 2;
                    var radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

                    for (var i = 0; i < this.numberOfAngles + 1; i++) {
                        var degree = angle * (i % this.numberOfAngles) - rotate
                        var x = this.start.x + radius * Math.cos(degree);
                        var y = this.start.y + radius * Math.sin(degree);
                        if (!this.withShift) {
                            x = this.start.x + (x - this.start.x) * width / height;
                            y = this.start.y + (y - this.start.y) * height / width;
                        }
                        x = center.x + (x - center.x) * this.scaleX;
                        y = center.y + (y - center.y) * this.scaleY;
                        context.lineTo(x, y);
                    }

                    break;
                case 'star':
                    var width = Math.abs(this.start.x - this.end.x);
                    var height = Math.abs(this.start.y - this.end.y);
                    var angle = 2 * Math.PI / this.numberOfAngles;
                    var rotate = Math.PI / 2;
                    var radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

                    for (var i = 0; i < this.numberOfAngles + 1; i++) {
                        var degree = angle * (i % this.numberOfAngles) - rotate
                        var x = this.start.x + radius * Math.cos(degree);
                        var y = this.start.y + radius * Math.sin(degree);
                        if (!this.withShift) {
                            x = this.start.x + (x - this.start.x) * width / height;
                            y = this.start.y + (y - this.start.y) * height / width;
                        }
                        x = center.x + (x - center.x) * this.scaleX;
                        y = center.y + (y - center.y) * this.scaleY;
                        context.lineTo(x, y);
                        degree = angle * (i % this.numberOfAngles + 0.5) - rotate
                        x = this.start.x + radius * Math.cos(degree) / 2;
                        y = this.start.y + radius * Math.sin(degree) / 2;
                        if (!this.withShift) {
                            x = this.start.x + (x - this.start.x) * width / height;
                            y = this.start.y + (y - this.start.y) * height / width;
                        }
                        x = center.x + (x - center.x) * this.scaleX;
                        y = center.y + (y - center.y) * this.scaleY;
                        context.lineTo(x, y);
                    }
                    break;
            }
            break;
        case 'illustration':
            var x = center.x + (this.end.x - center.x) * this.scaleX;
            var y = center.y + (this.end.y - center.y) * this.scaleY;
            var illustration = document.getElementById(this.illustration);
            this.width = illustration.width;
            this.height = illustration.height;
            context.drawImage(illustration, x, y, this.width * this.scaleX, this.height * this.scaleY);
            break;
    }
    context.closePath();
    context.lineWidth = this.line;
    context.strokeStyle = this.color;
    context.stroke();
    if (this.isFilled) {
        context.fillStyle = this.color;
        context.fill();
    }
}

Shape.prototype.focus = function (context)
{
    this.setBound();
    this.setAnchors();
    var center = new Point({});
    center.x = (this.leftTop.x + this.rightBottom.x) / 2;
    center.y = (this.leftTop.y + this.rightBottom.y) / 2;
    var tempLeftTop = new Point({});
    var tempRightBottom = new Point({});
    tempLeftTop.x = center.x + (this.leftTop.x - center.x) * this.scaleX;
    tempLeftTop.y = center.y + (this.leftTop.y - center.y) * this.scaleY;
    tempRightBottom.x = center.x + (this.rightBottom.x - center.x) * this.scaleX;
    tempRightBottom.y = center.y + (this.rightBottom.y - center.y) * this.scaleY;
    context.beginPath();
    context.rect(tempLeftTop.x, tempLeftTop.y, tempRightBottom.x - tempLeftTop.x, tempRightBottom.y - tempLeftTop.y);
    context.closePath();
    context.lineWidth = 5;
    context.strokeStyle = 'red';
    context.stroke();
}

Shape.prototype.contain = function (point)
{
    this.setBound();
    this.setAnchors();
    var center = new Point({});
    center.x = (this.leftTop.x + this.rightBottom.x) / 2;
    center.y = (this.leftTop.y + this.rightBottom.y) / 2;
    var tempLeftTop = new Point({});
    var tempRightBottom = new Point({});
    tempLeftTop.x = center.x + (this.leftTop.x - center.x) * this.scaleX;
    tempLeftTop.y = center.y + (this.leftTop.y - center.y) * this.scaleY;
    tempRightBottom.x = center.x + (this.rightBottom.x - center.x) * this.scaleX;
    tempRightBottom.y = center.y + (this.rightBottom.y - center.y) * this.scaleY;
    return point.x >= tempLeftTop.x && point.x <= tempRightBottom.x && point.y >= tempLeftTop.y && point.y <= tempRightBottom.y;
}

Shape.prototype.setBound = function ()
{
    var shape = this;
    shape.leftTop = new Point(shape.start);
    shape.rightBottom = new Point(shape.end);
    if ('paint-bucket' === shape.mode || 'brush' === shape.mode) {
        shape.points.forEach(function (point) {
            shape.leftTop.x = Math.min(shape.leftTop.x, shape.start.x + point.x);
            shape.leftTop.y = Math.min(shape.leftTop.y, shape.start.y + point.y);
            shape.rightBottom.x = Math.max(shape.rightBottom.x, shape.start.x + point.x);
            shape.rightBottom.y = Math.max(shape.rightBottom.y, shape.start.y + point.y);
        });
        return;
    }

    if ('line' === shape.mode) {
        if (shape.leftTop.x > shape.rightBottom.x) {
            shape.rightBottom.x = [shape.leftTop.x, shape.leftTop.x = shape.rightBottom.x][0]; // Swap
        }
        if (shape.leftTop.y > shape.rightBottom.y) {
            shape.rightBottom.y = [shape.leftTop.y, shape.leftTop.y = shape.rightBottom.y][0]; // Swap
        }
        return;
    }

    if ('shape' === shape.mode) {
        if ('oval' === shape.shape) {
            if (this.withShift) {
                var radius = Math.abs(shape.end.x - shape.start.x);
                shape.leftTop.x = shape.start.x - radius;
                shape.leftTop.y = shape.start.y - radius;
                shape.rightBottom.x = shape.start.x + radius;
                shape.rightBottom.y = shape.start.y + radius;
                return;
            }
            shape.leftTop.x = shape.start.x - Math.abs(shape.end.x - shape.start.x);
            shape.leftTop.y = shape.start.y - Math.abs(shape.end.y - shape.start.y);
            shape.rightBottom.x = shape.start.x + Math.abs(shape.end.x - shape.start.x);
            shape.rightBottom.y = shape.start.y + Math.abs(shape.end.y - shape.start.y);
            return;
        }
        var width = Math.abs(this.start.x - this.end.x);
        var height = Math.abs(this.start.y - this.end.y);
        var radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
        if (this.withShift) {
            shape.leftTop.x = shape.start.x - radius;
            shape.leftTop.y = shape.start.y - radius;
            shape.rightBottom.x = shape.start.x + radius;
            shape.rightBottom.y = shape.start.y + radius;
            return;
        }
        shape.leftTop.x = shape.start.x - radius * width / height;
        shape.rightBottom.x = shape.start.x + radius * width / height;
        shape.leftTop.y = shape.start.y - radius * height / width;
        shape.rightBottom.y = shape.start.y + radius * height / width;
        return;
    }

    if ('illustration' === shape.mode) {
        this.leftTop = new Point(this.end);
        this.rightBottom.x = this.leftTop.x + this.width;
        this.rightBottom.y = this.leftTop.y + this.height;
    }
}

Shape.prototype.setAnchors = function ()
{
    var center = new Point({});
    center.x = (this.leftTop.x + this.rightBottom.x) / 2;
    center.y = (this.leftTop.y + this.rightBottom.y) / 2;
    var tempLeftTop = new Point({});
    var tempRightBottom = new Point({});
    tempLeftTop.x = center.x + (this.leftTop.x - center.x) * this.scaleX;
    tempLeftTop.y = center.y + (this.leftTop.y - center.y) * this.scaleY;
    tempRightBottom.x = center.x + (this.rightBottom.x - center.x) * this.scaleX;
    tempRightBottom.y = center.y + (this.rightBottom.y - center.y) * this.scaleY;
    this.anchors[0].point.x = tempLeftTop.x;
    this.anchors[0].point.y = tempLeftTop.y;
    this.anchors[1].point.x = tempRightBottom.x;
    this.anchors[1].point.y = tempLeftTop.y;
    this.anchors[2].point.x = tempRightBottom.x;
    this.anchors[2].point.y = tempRightBottom.y;
    this.anchors[3].point.x = tempLeftTop.x;
    this.anchors[3].point.y = tempRightBottom.y;
}

Shape.prototype.resize = function (mouse)
{
    var center = new Point({});
    center.x = (this.leftTop.x + this.rightBottom.x) / 2;
    center.y = (this.leftTop.y + this.rightBottom.y) / 2;
    var width = (this.rightBottom.x - this.leftTop.x) / 2;
    var height = (this.rightBottom.y - this.leftTop.y) / 2;
    this.scaleX = Math.abs(mouse.x - center.x) / width;
    this.scaleY = Math.abs(mouse.y - center.y) / height;
    if (this.scaleShift) {
        this.scaleX = Math.min(this.scaleX, this.scaleY);
        this.scaleY = Math.min(this.scaleX, this.scaleY);
    }
}

Shape.prototype.fill = function (x, y, originalColor)
{
    var shape = this;
    var pointStack = [new Point({
        'x': x,
        'y': y,
    })];

    var directions = [
        new Point({'x': -1, 'y': 0}),
        new Point({'x': 0, 'y': -1}),
        new Point({'x': 1, 'y': 0}),
        new Point({'x': 0, 'y': 1}),
    ];

    while (pointStack.length) {
        var isValid = false;
        directions.forEach(function (direction) {
            if (isValid) {
                return;
            }
            var nextX = x + direction.x;
            var nextY = y + direction.y;
            if (nextX < 0 || nextX > shape.boundX || nextY < 0 || nextY > shape.boundY) {
                return;
            }
            var offset = (nextY * shape.boundX + nextX) * 4;
            isValid = true;
            for (var i = 0; i < 3; i++) {
                if (shape.imageData.data[offset + i] !== originalColor[i]) {
                    isValid = false;
                    break;
                }
            }
            if (isValid) {
                for (var i = 0; i < 3; i++) {
                    shape.imageData.data[offset + i] = shape.fillColor[i];
                }
                pointStack.push(new Point({'x': nextX, 'y': nextY}));
                return;
            }
        });

        if (isValid) {
            x = pointStack[pointStack.length - 1].x;
            y = pointStack[pointStack.length - 1].y;
        } else {
            var point = pointStack.pop();
            x = point.x;
            y = point.y;
            shape.points.push(new Point({'x': x - shape.start.x, 'y': y - shape.start.y}));
        }
    }
}
