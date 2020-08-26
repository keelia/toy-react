const RENDER_TO_DOM = Symbol("render to dom")//使用symbo使它变成私有方法
class ElementWrapper{//实体dom元素：得有root，可以挂载dom children或者挂载在别的实体dom上
    constructor(type){
        this.root = document.createElement(type)
    }

    setAttribute(name,value){
        if(name.match(/^on([\S\s]+)$/)){//tips: [\s\S]+ 表示匹配所有字符
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/,c=>c.toLowerCase()),value)//支持驼峰表达的事件
        }else{
            if(name === 'className'){//react把classname直接换成了class
                this.root.setAttribute('class',value)
            }else{
                this.root.setAttribute(name,value)
            }
            
        }
       
    }
    appendChild(component){
        //以下需要改造，因为没有root可以用了，而是用的range([RENDER_TO_DOM](range))
       // this.root.appendChild(component.root)//component的root要取出来，因为component是toyreact的component
        //1.appenchild是把元素放在最后的，所以替换掉component的最后一个childnode
        let range = document.createRange()
        range.setStart(this.root,this.root.childNodes.length)
        range.setEnd(this.root,this.root.childNodes.length)
        range.deleteContents()
        //2.把component的真实元素（root）放进去
        component[RENDER_TO_DOM](range)
    }
    [RENDER_TO_DOM](range){
        range.deleteContents()//删掉内容
        range.insertNode(this.root)//重新插入
    }
}

class TextWrapper{//实体dom text元素：得有root，可以被挂载在实体dom元素上。没有attr也没有child
    constructor(content){
        this.root = document.createTextNode(content)
    }
    [RENDER_TO_DOM](range){
        range.deleteContents()//删掉内容
        range.insertNode(this.root)//重新插入
    }
}

//基于jsx语法的自定义组件，不是实体dom元素，而是由实体dom元素组成的虚拟dom元素类，必须有render方法，或者它的组成成分
//在render函数返回的实体dom元素（可能包含别的虚拟dom元素类），
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

    // //实现更新的话就没办法用root去更新了，虽然root是跟渲染相关的
    // get root(){
    //     if(!this._root){
    //         this._root = this.render().root;//render出来的额仍然是个comoinent的话，这里就会发生递归，一直到component是一个text节点或者元素节点textWrapper/elementWrapper位置，可以返回root
    //     }
    //     return this._root
    // }

    [RENDER_TO_DOM](range){//负责更新组件：需要给它一个参数，创建component之后，做了redner的时候，其实是需要知道具体的位置的，不是只知道element，因为不一定element都插入到最后
        //range api是有关位置的,取一个元素然后把它渲染进range里面
        //为支持重新绘制，需要对比变化前后，需要先把range存一下
        this._range = range
        this.render()[RENDER_TO_DOM](range)
    }
    rerender(range){
        //把原来range里面的东西全删掉
        this._range.deleteContents()
        this[RENDER_TO_DOM](this._range)
    }

    setState(newState){//模拟react setState：合并新旧state，自动触发rerender
        //首先会假设已经有了state方法了，当然有可能是null，因此需要递归的形式去访问每一个的对象和属性：深度拷贝
        if(this.state === null || (typeof this.state !== 'object')){
            this.state = newState
            this.rerender()
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
        this.rerender()
    }

}

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