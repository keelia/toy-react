class ElementWrapper{//实体dom元素：得有root，可以挂载dom children或者挂载在别的实体dom上
    constructor(type){
        this.root = document.createElement(type)
    }

    setAttribute(name,value){
        this.root.setAttribute(name,value)
    }
    appendChild(component){
        this.root.appendChild(component.root)//component的root要取出来，因为component是toyreact的component
    }
}

class TextWrapper{//实体dom text元素：得有root，可以被挂载在实体dom元素上。没有attr也没有child
    constructor(content){
        this.root = document.createTextNode(content)
    }
}

//基于jsx语法的自定义组件，不是实体dom元素，而是由实体dom元素组成的虚拟dom元素类，必须有render方法，或者它的组成成分
//在render函数返回的实体dom元素（可能包含别的虚拟dom元素类），
export class Component{
    constructor(){
        this.props = Object.create(null)
        this.children = []
        this._root = null
    }

    setAttribute(name,value){
        this.props[name]=value
    }
    appendChild(child){
        this.children.push(child)
    }

    get root(){
        if(!this._root){
            this._root = this.render().root;//render出来的额仍然是个comoinent的话，这里就会发生递归，一直到component是一个text节点或者元素节点textWrapper/elementWrapper位置，可以返回root
        }
        return this._root
    }
}

export function createElement(elType,attributes,...children) {
    let element
    if(typeof elType === 'string'){
        element = new ElementWrapper(elType)
    }else{
        element = new elType
    }
    console.log(element,attributes,children)
    for (const key in attributes) {
        if (attributes.hasOwnProperty(key)) {
            const property = attributes[key];
            element.setAttribute(key,property)
        }
    }
    let insertChildren = (children)=>{
        for (const child of children) {
            if(typeof child === 'string'){
                child = new TextWrapper(child)
            }
            //children的child有可能还是个数组，需要循环调用insertChildren
            if(typeof child === 'object' && (child instanceof Array)){
                insertChildren(child)
            }else{
                element.appendChild(child)
            }
        }
    }
    insertChildren(children)
    return element
}

//把虚拟元素实例挂载在实体dom上
export function render(component,parentElement){//parentElement是实dom：看react：ReactDOM.render(<Game />, document.getElementById("root"));
    console.log('render!')
    parentElement.appendChild(component.root)
}