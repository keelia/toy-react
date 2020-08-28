const RENDER_TO_DOM = Symbol("render to dom")//使用symbo使它变成私有方法
export class Component{
    constructor(){
        this.props = Object.create(null)
        this.children = []
        this._root = null
        this._range = null
    }

    setAttribute(name,value){
        this.props[name]=value
    }
    appendChild(child){
        this.children.push(child)
    }

    get vdom(){
        return this.render().vdom
    }

    [RENDER_TO_DOM](range){//负责更新组件：需要给它一个参数，创建component之后，做了redner的时候，其实是需要知道具体的位置的，不是只知道element，因为不一定element都插入到最后
        //range api是有关位置的,取一个元素然后把它渲染进range里面
        //为支持重新绘制，需要对比变化前后，需要先把range存一下
        this._range = range
        this._vdom = this.vdom//_vdom:old vdom, to be compared in update method
        this._vdom[RENDER_TO_DOM](range)
    }

    update(){
        let isSameNode = (oldNode,newNode)=>{
            if(oldNode.type!==newNode.type){
                return false
            }

            for (const name in newNode.props) {
                if(newNode.props[name]!==oldNode.props[name]){
                    return false
                }
            }
            if(Object.keys(oldNode.props).length > Object.keys(newNode.props).length ){
                return false
            }
            if(newNode.type ==='#text'){
                if(newNode.content!==oldNode.content){
                    return false
                }
            }
            return true
        }
        let update = (oldNode,newNode)=>{
            //compare root node: type(complete rerender),props(complete rerender)
            //compare children
            //#text: content
            if(!isSameNode(oldNode,newNode)){
                //override old node
                newNode[RENDER_TO_DOM](oldNode._range)//replace oldnode's range
                return
            }
            //set oldnode'range as newNode range
            newNode._range = oldNode._range//only when oldnode/newnode is elemenwrapper

            //children
            let newVChildren = newNode.vchildren
            let oldVChildren = oldNode.vchildren

            if(!newVChildren ||!newVChildren.length){
                return
            }

            let tailRange = oldVChildren[oldVChildren.length -1]._range

            for (let i = 0; i < newVChildren.length; i++) {
                const newVChild = newVChildren[i];
                const oldVChild = oldVChildren[i];
                if(i<oldVChildren.length){
                    update(oldVChild,newVChild)
                }else{
                    //need insert newchild
                    let range = document.createRange()
                    range.setStart(tailRange.endContainer,tailRange.endOffset)
                    range.setEnd(tailRange.endContainer,tailRange.endOffset)
                    newVChild[RENDER_TO_DOM](range)
                    tailRange = range
                }
                
            }
        }
        let vdom = this.vdom
        update(this._vdom,vdom)
        this._vdom = vdom
    }

    setState(newState){//模拟react setState：合并新旧state，自动触发rerender
        //首先会假设已经有了state方法了，当然有可能是null，因此需要递归的形式去访问每一个的对象和属性：深度拷贝
        if(this.state === null || (typeof this.state !== 'object')){
            this.state = newState
            this.update()
            return
        }
        let merge = (oldState,newState)=>{
            //for 循环所有的子节点，然后去merge
            for (const p in newState) {
                if (oldState[p] === null || (typeof oldState[p] !== 'object' )){
                    oldState[p]= newState[p]
                }else{
                    merge(oldState[p],newState[p])
                }
            }
        }
        merge(this.state,newState)
        this.update()
    }

}


class ElementWrapper extends Component{ //实体dom元素：得有root，可以挂载dom children或者挂载在别的实体dom上
    constructor(type){
        super(type)
       // this.root = document.createElement(type)
        this.type = type
    }

    get vdom(){
        this.vchildren = this.children.map(child=>child.vdom)
        return this
    }


    [RENDER_TO_DOM](range){
        this._range = range
        let root = document.createElement(this.type)
        for (const name in this.props) {
            const value = this.props[name]
            if(name.match(/^on([\S\s]+)$/)){//tips: [\s\S]+ 表示匹配所有字符
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/,c=>c.toLowerCase()),value)//支持驼峰表达的事件
            }else{
                if(name === 'className'){//react把classname直接换成了class
                    root.setAttribute('class',value)
                }else{
                    root.setAttribute(name,value)
                }
                
            }
        }

        if(!this.vchildren){
            this.vchildren = this.children.map(child=>child.vdom)
        }
        for (const child of this.vchildren) {
            let childRange = document.createRange()
            childRange.setStart(root,root.childNodes.length)
            childRange.setEnd(root,root.childNodes.length)
           
            //2.把component的真实元素（root）放进去
            child[RENDER_TO_DOM](childRange)
        }
        replaceContent(range,root) 

    }
}

class TextWrapper extends Component{//实体dom text元素：得有root，可以被挂载在实体dom元素上。没有attr也没有child
    constructor(content){
        super(content)
        this.type ='#text'
        this.content = content
    }

    get vdom(){
        return this
        return {
            type:'#text',
            content:this.content
        }
    }
    [RENDER_TO_DOM](range){
        this._range = range
        const root = document.createTextNode(this.content)
        replaceContent(range,root)
    }
}

//基于jsx语法的自定义组件，不是实体dom元素，而是由实体dom元素组成的虚拟dom元素类，必须有render方法，或者它的组成成分
//在render函数返回的实体dom元素（可能包含别的虚拟dom元素类），

export function createElement(elType,attributes,...children) {
    let element
    if(typeof elType === 'string'){
        element = new ElementWrapper(elType)
    }else{
        element = new elType
    }
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

            if(child === null){//react 可能会传成null，child有些是空的
                continue
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

function replaceContent(range,node){
    //insert
    range.insertNode(node)
    range.setStartAfter(node)
    range.deleteContents()

    range.setStartBefore(node)
    range.setEndAfter(node)
}

//把虚拟元素实例挂载在实体dom上
export function render(component,parentElement){//parentElement是实dom：看react：ReactDOM.render(<Game />, document.getElementById("root"));
    //1.清空parentElement中的内容
    let range = document.createRange()
    range.setStart(parentElement,0)
    range.setEnd(parentElement,parentElement.childNodes.length)//必须是childnodes，需要包括文本节点和注释节点
    range.deleteContents()
    //2.把component的range放进去
    component[RENDER_TO_DOM](range)
}