"use strict";

//We are instancing the same cube 11 times for the bear and 2 times for the tree, so the main object is one (the cube)
var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var animationB = false; //Button for the animation

var bearTex1, bearTex2, treeTex1, treeTex2, backTex;
//Managing the texture's attachment
var bearHeadBool = false, bearBool = false, trunkBool = false, branchBool = false;
//Images that will be binded to the texture
var bearHeadImage, bearImage, trunkImage, branchImage, backImage;
var texCoordsArray = [];

var texCoord = [
  vec2(0, 0),
  vec2(0, 1),
  vec2(1, 1),
  vec2(1, 0)
];

var vertices = [

    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

//13 transformations that we apply
var torsoId = 0;
var torsoId2 =11;
var headId = 1;
var headId2 = 12;
var FrontUpperLegId = 2;  //The leg which is closer to the viewer
var FrontLowerLegId = 3;
var BackUpperLegId = 4; //The leg which is farther from the viewer
var BackLowerLegId = 5;
var FrontUpperArmId = 6;  //The arm which is closer to the viewer
var FrontLowerArmId = 7;
var BackUpperArmId = 8; //The arm which is farther from the viewer
var BackLowerArmId = 9;
var tailId = 10;

var torsoHeight = 6.0;
var torsoWidth = 10.5;
var headHeight = 2.5;
var headWidht = 3.0;
var upperLegWidth  = 2.0;
var lowerLegWidth  = 2.0;
var lowerLegHeight = 2.0;
var upperLegHeight = 3.0;
var tailHeight = 1.0;
var tailWidth = 2.0;

var numNodes = 11; //Hierarchical structure based on 11 nodes

var theta = [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10]; //Rotation of the various body part
var bearPosArray = [0.0, -13.0, 0.0]; //Bear's positioning
var yValue = [bearPosArray[1],1.0,-2.0,-3.0,-2.0,-3.0,-2.0,-3.0,-2.0,-3.0,1.0]; //Y value of the various body part

var rotUpperPart = 1; //Rotation of the upper part of legs and arms
var rotLowerPart = 0.6; //Rotation of the lower part of legs and arms
var rotHead = 0.25; //Rotation of the head
var yUpperPart = 0.07;   //Elevation of the upper part of legs
var yTorso = 0.02;  //Elevation of the torso
var xTorso = 0.10;  //Transition of the torso
var scratch = 6;    //Number of scratches along the tree
var keyframe_0 = true, keyframe_1 = true;   //Control on the bear's transition in the animation

var numVertices = 24;

var stack = []; //Stack of matrices

var figure = [];
//Here it's where we create the structure, 11 objects (initially empty)
for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null); 

var vBuffer;
var modelViewLoc;

var pointsArray = [];

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0] = a;
   result[5] = b;
   result[10] = c;
   return result;
}

//--------------------------------------------

//Every node has associated these informations -> First sibling (same level) and first child (next level)
function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

//Initializes the node depending on their ID
function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case torsoId:

    m = translate(bearPosArray[0], bearPosArray[1], bearPosArray[2]);
    m = mult(m,rotate(theta[torsoId], vec3(0, 1, 0) ));
    m = mult(m,rotate(theta[torsoId2],vec3(0, 0, 1) ));
    figure[torsoId] = createNode( m, torso, null, headId ); //Torso has no sibling and the first child is the head
    break;

    case headId:

    m = translate(5.5, yValue[headId], 0.0);
    m = mult(m , rotate(theta[headId], vec3(0, 1, 0)));
    m = mult(m , rotate(theta[headId2],vec3(0, 0, 1) ));
    figure[headId] = createNode( m, head, FrontUpperLegId, null ); //Next sibling is the FrontUpperLeg, No childen
    break;

    case FrontUpperLegId:

    m = translate(-3.0, yValue[FrontUpperLegId], 2.0);
    m = mult(m , rotate(theta[FrontUpperLegId], vec3(0, 0, 1)));
    figure[FrontUpperLegId] = createNode( m, FrontUpperLeg, BackUpperLegId, FrontLowerLegId ); //Next sibling is BackUpperLeg, the child is FrontLowerLeg
    break;
    
    case FrontLowerLegId:

    m = translate(0.0, yValue[FrontLowerLegId], 0.0);
    m = mult(m, rotate(theta[FrontLowerLegId],vec3(0, 0, 1)));
    figure[FrontLowerLegId] = createNode( m, FrontLowerLeg, null, null );
    break;

    case BackUpperLegId:

    m = translate(-3.0, yValue[BackUpperLegId], -2.0);
    m = mult(m , rotate(theta[BackUpperLegId], vec3(0, 0, 1)));
    figure[BackUpperLegId] = createNode( m, BackUpperLeg, FrontUpperArmId, BackLowerLegId );
    break;

    case BackLowerLegId:

    m = translate(0.0, yValue[BackLowerLegId], 0.0);
    m = mult(m, rotate(theta[BackLowerLegId],vec3(0, 0, 1)));
    figure[BackLowerLegId] = createNode( m, BackLowerLeg, null, null );
    break;

    case FrontUpperArmId:

    m = translate(3.0, yValue[FrontUpperArmId], 2.0);
    m = mult(m , rotate(theta[FrontUpperArmId], vec3(0, 0, 1)));
    figure[FrontUpperArmId] = createNode( m, FrontUpperArm, BackUpperArmId, FrontLowerArmId );
    break;

    case FrontLowerArmId:

    m = translate(0.0, yValue[FrontLowerArmId], 0.0);
    m = mult(m, rotate(theta[FrontLowerArmId],vec3(0, 0, 1)));
    figure[FrontLowerArmId] = createNode( m, FrontLowerArm, null, null );
    break;

    case BackUpperArmId:

    m = translate(3.0, yValue[BackUpperArmId], -2.0);
    m = mult(m , rotate(theta[BackUpperArmId], vec3(0, 0, 1)));
    figure[BackUpperArmId] = createNode( m, BackUpperArm, tailId, BackLowerArmId );
    break;

    case BackLowerArmId:

    m = translate(0.0, yValue[BackLowerArmId], 0.0);
    m = mult(m, rotate(theta[BackLowerArmId],vec3(0, 0, 1)));
    figure[BackLowerArmId] = createNode( m, BackLowerArm, null, null );
    break;

    case tailId:

    m = translate(-5.0, yValue[tailId], 0.0);
    m = mult(m , rotate(theta[tailId], vec3(0, 0, 1)));
    figure[tailId] = createNode( m, tail, null, null );
    break;

    }

}

//--------------------------------------------------------------------------------- TRAVERSE FUNCTION ---------------------------------------------------------------------------------//

function traverse(Id) {

   if(Id == null) return;
   stack.push(modelViewMatrix); //Keeps in memory the modelView applied to the parent. Before rendering the sibling, we pop the matrix.
                                //This is done because sibling don't get influenced by the modelView which we apply to the children
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform); //Update the modelViewMatrix
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child); //If it has a child we call this function recursively
    modelViewMatrix = stack.pop(); // Restoring the previous value of the modelView
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {

    bearBool = true;
    gl.uniform1f(gl.getUniformLocation(program, "bearBool"), bearBool);

    trunkBool = false;
    gl.uniform1f(gl.getUniformLocation(program, "trunkBool"), trunkBool);

    branchBool = false;
    gl.uniform1f(gl.getUniformLocation(program, "branchBool"), branchBool); 

    //instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0.0) );
    instanceMatrix = mult(modelViewMatrix, scale( torsoWidth, torsoHeight, torsoWidth-1.0));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  head() {    

    instanceMatrix = mult(modelViewMatrix, scale(headWidht, headHeight, headWidht) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<5; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    bearHeadBool = true;
    gl.uniform1f(gl.getUniformLocation(program, "bearHeadBool"), bearHeadBool);

    bearBool = false;
    gl.uniform1f(gl.getUniformLocation(program, "bearBool"), bearBool);
    gl.drawArrays(gl.TRIANGLE_FAN, 4*5, 4);
}

function  FrontUpperLeg() {

    bearHeadBool = false;
    gl.uniform1f(gl.getUniformLocation(program, "bearHeadBool"), bearHeadBool);

    bearBool = true;
    gl.uniform1f(gl.getUniformLocation(program, "bearBool"), bearBool);

    instanceMatrix = mult(modelViewMatrix, translate(0.0, -(0.5 * upperLegHeight), 0.0) );
    instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function FrontLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, -(0.5 * lowerLegHeight), 0.0) );
    instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  BackUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, -(0.5 * upperLegHeight), 0.0) );
    instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function BackLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, -(0.5 * lowerLegHeight), 0.0) );
    instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  FrontUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, -(0.5 * upperLegHeight), 0.0) );
    instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function FrontLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, -(0.5 * lowerLegHeight), 0.0) );
    instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  BackUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, -(0.5 * upperLegHeight), 0.0) );
    instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function BackLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, -(0.5 * lowerLegHeight), 0.0) );
    instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  tail() {

    instanceMatrix = mult(modelViewMatrix, translate(torsoWidth, torsoHeight, 0.0) );
    instanceMatrix = mult(modelViewMatrix, scale(tailWidth, tailHeight, tailWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[b]);
     texCoordsArray.push(texCoord[1]);

     pointsArray.push(vertices[c]);
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[d]);
     texCoordsArray.push(texCoord[3]);
}

function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 5, 4, 7, 6 );
    quad( 5, 4, 0, 1 );
    quad( 2, 3, 7, 6 );
}

function trunk(){
    trunkBool = true;
    gl.uniform1f(gl.getUniformLocation(program, "trunkBool"), trunkBool);

    var m = mult(translate(37, -10.5, -9.0),scale( 8.0, 18.0, 10.0))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function branch(){

    trunkBool = false;
    gl.uniform1f(gl.getUniformLocation(program, "trunkBool"), trunkBool);

    branchBool = true;
    gl.uniform1f(gl.getUniformLocation(program, "branchBool"), branchBool);

    var m = translate(37, 3.0, 0.0);
    m=mult(m,scale(14.0,10.0,10.0));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function background(){

    bearHeadBool = false;
    gl.uniform1f(gl.getUniformLocation(program, "bearHeadBool"), bearHeadBool);

    bearBool = false;
    gl.uniform1f(gl.getUniformLocation(program, "bearBool"), bearBool);

    trunkBool = false;
    gl.uniform1f(gl.getUniformLocation(program, "trunkBool"), trunkBool);

    branchBool = false;
    gl.uniform1f(gl.getUniformLocation(program, "branchBool"), branchBool);

    var m = mult(translate(20.0,-5.0, -9.0),scale(55.0, 33.0, 1.0))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function drawtree(){
    trunk();
    branch();
    background();
}

//--------------------------------------------------------------------------------- INIT FUNCTION ---------------------------------------------------------------------------------//

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram( program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-7.0,45.0,-25.0, 10.0,-10.0,10.0);
    modelViewMatrix = mat4();


    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix)  );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix)  );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    cube();

    vBuffer = gl.createBuffer();

    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    //Binding the image from the .html file into the .js file
    backImage = document.getElementById("Background");
    trunkImage = document.getElementById("TrunkImage");
    branchImage = document.getElementById("BranchImage");
    bearImage = document.getElementById("BearImage");
    bearHeadImage = document.getElementById("BearHeadImage");

    configureTexture();   //Allocating the texture
    
    //Creation of the various texture's unit and binding them to the respective textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, treeTex1);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap1"), 0); //Branch

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, treeTex2);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap2"), 1); //Trunk

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, bearTex1);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap3"), 2); //Bear head

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, bearTex2);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap4"), 3); //Bear

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, backTex);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap5"), 4); //Background

    for(i=0; i<numNodes; i++) initNodes(i);

    document.getElementById("animationOn").onclick = function(){animationB=true;};
    document.getElementById("animationOff").onclick = function(){animationB=false;};
    
    render();
}

//--------------------------------------------------------------------------------- ANIMATION ---------------------------------------------------------------------------------//

function animation(){
    //console.log(bearPosArray[0]);
    
    //Bear walks until it reaches a fixed point at keyframe_0
    if(bearPosArray[0]<30 && keyframe_0){
        bearPosArray[0] += xTorso;
        initNodes(torsoId);

        //Leg and arm rotation during walking
        theta[FrontUpperArmId] -= rotUpperPart;
        initNodes(FrontUpperArmId);
        theta[FrontLowerArmId] += rotLowerPart;
        initNodes(FrontLowerArmId);

        theta[BackUpperLegId] -= rotUpperPart;
        initNodes(BackUpperLegId);
        theta[BackLowerLegId] += rotLowerPart;
        initNodes(BackLowerLegId);

        theta[FrontUpperLegId] += rotUpperPart;
        initNodes(FrontUpperLegId);
        theta[FrontLowerLegId] -= rotLowerPart;
        initNodes(FrontLowerLegId);

        theta[BackUpperArmId] += rotUpperPart;
        initNodes(BackUpperArmId);
        theta[BackLowerArmId] -= rotLowerPart;
        initNodes(BackLowerArmId);
        
        //Tail rotation during walking
        theta[tailId] += (rotUpperPart-rotLowerPart);
        initNodes(tailId);
        
        //Head rotation during walking
        theta[headId] += rotHead;
        initNodes(headId);

        //Leg, arm and head rotation check
        if(theta[FrontUpperArmId] < -45){
            rotUpperPart = -rotUpperPart;
            rotLowerPart = -rotLowerPart;
        }
        if(theta[FrontUpperArmId] > 45){
            rotUpperPart = -rotUpperPart;
            rotLowerPart = -rotLowerPart;
        }
        if(theta[headId] > 15){
            rotHead = -rotHead;
        }
        if(theta[headId] < -15){
            rotHead = -rotHead;
        }
    }
    //Bear prepares itself to turn
    else if(bearPosArray[0] > 30 && bearPosArray[0] < 31 && keyframe_1){

        //Reset the bear's status
        theta[FrontUpperArmId] = 0.0;
        initNodes(FrontUpperArmId);
        theta[FrontLowerArmId] = 0;
        initNodes(FrontLowerArmId);
        theta[FrontUpperLegId] = 0;
        initNodes(FrontUpperLegId);
        theta[FrontLowerLegId] = 0;
        initNodes(FrontLowerLegId);
        theta[BackUpperLegId] = 0;
        initNodes(BackUpperLegId);
        theta[BackLowerLegId] = 0;
        initNodes(BackLowerLegId);
        theta[BackUpperArmId] = 0;
        initNodes(BackUpperArmId);
        theta[BackLowerArmId] = 0;
        initNodes(BackLowerArmId);
        theta[headId] = 0;
        initNodes(headId);
        bearPosArray[0] += 1;
    }
    //Bear turns backwards
    else if(bearPosArray[0] >= 31 && keyframe_1){
        //After reaching a specific point the bear turns backwards
        if(theta[torsoId]<=170){

            theta[torsoId] += 0.7;
            initNodes(torsoId);

            //Leg movement for turning
            yValue[FrontUpperArmId] += yUpperPart;
            initNodes(FrontUpperArmId);

            yValue[FrontUpperLegId] += yUpperPart;
            initNodes(FrontUpperLegId);

            yValue[BackUpperLegId] += yUpperPart;
            initNodes(BackUpperLegId);

            yValue[BackUpperArmId] += yUpperPart;
            initNodes(BackUpperArmId);

            if(yValue[FrontUpperArmId] > -1){
                yUpperPart = - yUpperPart;
            }
            else if(yValue[FrontUpperArmId] < -2){
                yUpperPart = - yUpperPart;
            }

        }

        else{
            //Bear stands up till a certain rotation point after turning
            if(theta[torsoId2] >= -80 && keyframe_0){
                theta[torsoId2] -= 1.0;
                initNodes(torsoId);

                theta[FrontUpperLegId] += 0.2;
                initNodes(FrontUpperLegId);
                theta[FrontLowerLegId] -= rotLowerPart ;
                initNodes(FrontLowerLegId);
                theta[BackUpperLegId] += 0.2;
                initNodes(BackUpperLegId);
                theta[BackLowerLegId] -= rotLowerPart;
                initNodes(BackLowerLegId);

                theta[FrontLowerArmId] -= rotLowerPart;
                initNodes(FrontLowerArmId);
                theta[BackLowerArmId] -= rotLowerPart ;
                initNodes(BackLowerArmId);
            }
            else{
                //Beginning of the scratching (6 times)
                if(scratch > 0){

                    bearPosArray[1] -= yTorso;
                    initNodes(torsoId);

                    theta[FrontUpperLegId] += rotUpperPart;
                    initNodes(FrontUpperLegId);

                    theta[BackUpperLegId] += rotUpperPart;
                    initNodes(BackUpperLegId);
                    
                    theta[headId] += rotHead;
                    theta[headId2] += rotHead;
                    initNodes(headId);
                    
                    if(theta[headId] > 15){
                        rotHead = -rotHead;
                    }
                    if(theta[headId] < -15){
                        rotHead = -rotHead;
                    }
                    if(bearPosArray[1] < -13.5){
                        yTorso = - yTorso;
                        rotUpperPart = -rotUpperPart;
                    }
                    if(bearPosArray[1] > -13){
                        yTorso = - yTorso;
                        rotUpperPart = -rotUpperPart;
                        scratch -= 1;
                    }
                }
                else{
                    //End of scratching
                    keyframe_0=false;
                    //Returning back in walking position
                    if(theta[torsoId2] < 0){
                        
                        theta[torsoId2] += 1.0;
                        initNodes(torsoId);

                        theta[FrontUpperLegId] -= 0.2;
                        initNodes(FrontUpperLegId);
                        theta[FrontLowerLegId] += rotLowerPart ;
                        initNodes(FrontLowerLegId);
                        theta[BackUpperLegId] -= 0.2;
                        initNodes(BackUpperLegId);
                        theta[BackLowerLegId] += rotLowerPart ;
                        initNodes(BackLowerLegId);

                        theta[FrontLowerArmId] += rotLowerPart ;
                        initNodes(FrontLowerArmId);
                        theta[BackLowerArmId] += rotLowerPart ;
                        initNodes(BackLowerArmId);
                    }
                    else{
                        //All keyframes all false, the bear can go only towards the last keyframe
                        keyframe_1=false;
                    }
                }
            }
        }

    }
    //Walking back
    else{       
    
        bearPosArray[0] -= xTorso;
        bearPosArray[1] = -13.5;
        initNodes(torsoId);

        theta[FrontUpperArmId] -= rotUpperPart;
        initNodes(FrontUpperArmId);
        theta[FrontLowerArmId] += rotLowerPart;
        initNodes(FrontLowerArmId);

        theta[BackUpperLegId] -= rotUpperPart;
        initNodes(BackUpperLegId);
        theta[BackLowerLegId] += rotLowerPart;
        initNodes(BackLowerLegId);

        theta[FrontUpperLegId] += rotUpperPart;
        initNodes(FrontUpperLegId);
        theta[FrontLowerLegId] -= rotLowerPart;
        initNodes(FrontLowerLegId);

        theta[BackUpperArmId] += rotUpperPart;
        initNodes(BackUpperArmId);
        theta[BackLowerArmId] -= rotLowerPart;
        initNodes(BackLowerArmId);

        theta[tailId] += (rotUpperPart-rotLowerPart);
        initNodes(tailId);
        
        theta[headId] += rotHead;
        initNodes(headId);

        //Leg, arm and head rotation during walking
        if(theta[FrontUpperArmId] < -45){
            rotUpperPart = -rotUpperPart;
            rotLowerPart = -rotLowerPart;

        }
        if(theta[FrontUpperArmId] > 45){
            rotUpperPart = -rotUpperPart;
            rotLowerPart = -rotLowerPart;
        }
        if(theta[headId] > 15){
            rotHead = -rotHead;
        }
        if(theta[headId] < -15){
            rotHead = -rotHead;
        }
    }
        
    

}

//--------------------------------------------------------------------------------- TEXTURE CONFIGURATION ---------------------------------------------------------------------------------//

function configureTexture() {
    //Leaves texture
    treeTex1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, treeTex1);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,gl.RGB, gl.UNSIGNED_BYTE, branchImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //Trunk texture
    treeTex2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, treeTex2);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,gl.RGB, gl.UNSIGNED_BYTE, trunkImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //Bear's head texture
    bearTex1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, bearTex1);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,gl.RGB, gl.UNSIGNED_BYTE, bearHeadImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //Bear's fur texture
    bearTex2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, bearTex2);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,gl.RGB, gl.UNSIGNED_BYTE, bearImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //Background
    backTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, backTex);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,gl.RGB, gl.UNSIGNED_BYTE, backImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

}

//--------------------------------------------------------------------------------- RENDER FUNCTION ---------------------------------------------------------------------------------//

var render = function() {

        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        traverse(torsoId);
        drawtree();
        if(animationB) animation(); //Animation starts only after pushing the button
        requestAnimationFrame(render);
}
