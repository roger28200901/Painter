/* Layer */
var Layer = function (data)
{
    this.name = data.name || '';
    this.element = data.element || null;
    this.shapes = [];
}
